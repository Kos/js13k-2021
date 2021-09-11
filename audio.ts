import CPlayer from "./player-small";
import song from "./song";

type TSong = typeof song;

const ac = new AudioContext();

const bgm: TSong = {
  ...song,
  songData: song.songData.slice(0, 6),
  numChannels: 6,
};

function getFirstIndex({ endPattern }: TSong, instrument: number) {
  for (let px = 0; px <= endPattern; ++px) {
    if (song.songData[instrument].p[px]) {
      return px;
    }
  }
  // throw new Error("Failed to find first pattern");
}

function trimEffect(song: TSong, instrument: number, m: number = 0): TSong {
  const fx = getFirstIndex(song, instrument);
  const { i, p, c } = song.songData[instrument];
  return {
    ...song,
    songData: [
      {
        i,
        p: [p[fx] + m],
        c,
      },
    ],
    numChannels: 1,
    endPattern: 1,
  };
}

function trimEffect2(song: TSong, instrument: number): TSong {
  const fx = getFirstIndex(song, instrument);
  const { i, p, c } = song.songData[instrument];
  const { i: i2, p: p2, c: c2 } = song.songData[instrument + 1];
  return {
    ...song,
    songData: [
      {
        i,
        p: p.slice(fx, fx + 1),
        c,
      },
      {
        i: i2,
        p: p2.slice(fx, fx + 1),
        c: c2,
      },
    ],
    numChannels: 2,
    endPattern: 1,
  };
}

function toBuffer(song: TSong): AudioBuffer {
  const p = CPlayer();
  p.init(song);
  while (p.generate() < 1);
  return p.createAudioBuffer(ac);
}

function trimPrefix(buffer: AudioBuffer, seconds: number) {
  const samplesToTrim = 0 | (seconds * buffer.sampleRate);
  console.log("woudl trim", { samplesToTrim, seconds, secondsPerBeat });
  const result = ac.createBuffer(
    2,
    buffer.length - samplesToTrim,
    buffer.sampleRate
  );
  [0, 1].forEach((n) => {
    const data = buffer.getChannelData(n);
    const source = data.subarray(samplesToTrim);
    const dest = result.getChannelData(n);
    dest.set(source);
  });
  return result;
}

function toSource(buffer: AudioBuffer, trimMs: number = 0) {
  const source = ac.createBufferSource();
  source.buffer = buffer;
  source.connect(ac.destination);
  return source;
}

const bpm = 100;
const secondsPerBeat = 60 / bpm;

function timeIntoNextBeat(): number {
  let { currentTime } = ac;
  const sbb = secondsPerBeat;

  const beatsSoFar = 0 | (currentTime / sbb);
  const lastBeatTime = beatsSoFar * sbb;
  const timeIntoNextBeat = currentTime - lastBeatTime;
  return timeIntoNextBeat;
}

export function currentBeatFraction(): number {
  return timeIntoNextBeat() / secondsPerBeat;
}

export function nextBeat(): number {
  const frac = currentBeatFraction();
  const remainingFrac = frac ? 1 - frac : 0;
  const nextBeat = ac.currentTime + remainingFrac * secondsPerBeat;
  return nextBeat;
}

function play(
  song: TSong,
  { loop, now }: { loop?: boolean; now?: boolean } = {}
) {
  let buf = toBuffer(song);
  return () => {
    let source = toSource(buf);
    source.loop = loop;
    if (loop) {
      source.start(nextBeat());
      return;
    }
    if (now) {
      source.start();
      return;
    }
    // beat correction for the rest
    let cbf = currentBeatFraction();
    if (cbf > 0.2) {
      source.start(nextBeat());
    } else if (cbf > 0.08) {
      const trim = (cbf - 0.08) * 0.6;
      source = toSource(trimPrefix(buf, trim));
      source.start();
    } else {
      source.start();
    }
  };
}

const playBGM = play(bgm, { loop: true });
const playQ = play(trimEffect(song, 6));
const playW = play(trimEffect(song, 7));
const playE = play(trimEffect(song, 9));
const playS = play(trimEffect2(song, 11));
const playBoom1 = play(trimEffect(song, 10), { now: true });
const playBoom2 = play(trimEffect(song, 10, 1), { now: true });

function playBoom() {
  (Math.random() < 0.5 ? playBoom1 : playBoom2)();
}

export { playBGM, playQ, playW, playE, playS, playBoom };
playBGM();
