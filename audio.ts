import CPlayer from "./player-small";
import song from "./song";

type TSong = typeof song;

const ac = new AudioContext();

const bgm: TSong = {
  ...song,
  songData: song.songData.slice(0, 5),
  numChannels: 5,
};

function getFirstIndex({ endPattern }: TSong, instrument: number) {
  for (let px = 0; px <= endPattern; ++px) {
    if (song.songData[instrument].p[px]) {
      return px;
    }
  }
  // throw new Error("Failed to find first pattern");
}

function trimEffect(song: TSong, instrument: number): TSong {
  const fx = getFirstIndex(song, instrument);
  const { i, p, c } = song.songData[instrument];
  return {
    ...song,
    songData: [
      {
        i,
        p: p.slice(fx, fx + 1),
        c,
      },
    ],
    numChannels: 1,
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
    console.log("would trim", { dest, source });

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

function timeIntoNextBeat(snb: boolean = false): number {
  let { currentTime } = ac;
  // if (snb) currentTime += secondsPerBeat / 2;
  const sbb = secondsPerBeat / (snb ? 2 : 1);

  const beatsSoFar = 0 | (currentTime / sbb);
  const lastBeatTime = beatsSoFar * sbb;
  const timeIntoNextBeat = currentTime - lastBeatTime;
  return timeIntoNextBeat;
}

export function currentBeatFraction(snb: boolean = false): number {
  return timeIntoNextBeat(snb) / secondsPerBeat;
}

export function nextBeat(snb: boolean = false): number {
  const frac = currentBeatFraction(snb);
  const remainingFrac = frac ? 1 - frac : 0;
  const nextBeat = ac.currentTime + remainingFrac * secondsPerBeat;
  return nextBeat;
}

function play(song: TSong, loop: boolean = false, snp: boolean = false) {
  let buf = toBuffer(song);
  return () => {
    let source = toSource(buf);
    if (loop) {
      source.loop = true;
      source.start(nextBeat());
      return;
    }
    let cbf = currentBeatFraction(snp);
    if (cbf > 0.2) {
      source.start(nextBeat(snp));
    } else if (cbf > 0.08) {
      const trim = (cbf - 0.08) * 0.6;
      source = toSource(trimPrefix(buf, trim));
      source.start();
    } else {
      source.start();
    }
  };
}

const playBGM = play(bgm, true);
const playQ = play(trimEffect(song, 6));
const playW = play(trimEffect(song, 7));
const playE = play(trimEffect(song, 9));
const playBoom = play(trimEffect(song, 10), false, true); // BTW I Broke boom

export { playBGM, playQ, playW, playE, playBoom };
playBGM();
