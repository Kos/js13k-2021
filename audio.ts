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

function toSource(buffer: AudioBuffer) {
  const source = ac.createBufferSource();
  source.buffer = buffer;
  source.connect(ac.destination);
  return source;
}

const bpm = 100;
const secondsPerBeat = 60 / bpm;

export function currentBeatFraction(divisor: number = 1): number {
  const { currentTime } = ac;
  const sbb = secondsPerBeat / divisor;

  const beatsSoFar = 0 | (currentTime / sbb);
  const lastBeatTime = beatsSoFar * sbb;
  const timeIntoNextBeat = currentTime - lastBeatTime;
  return timeIntoNextBeat / sbb;
}

export function nextBeat(divisor: number = 1): number {
  const frac = currentBeatFraction(divisor);
  const remainingFrac = frac ? 1 - frac : 0;
  const nextBeat = ac.currentTime + remainingFrac * secondsPerBeat;
  console.log({
    currentTime: ac.currentTime,
    nextBeat: nextBeat,
    delta: nextBeat - ac.currentTime,
  });
  return nextBeat;
}

function play(song: TSong, loop: boolean = false, divisor: number = 1) {
  const buf = toBuffer(song);
  return () => {
    const source = toSource(buf);
    source.loop = loop;
    source.start(nextBeat(divisor));
  };
}

const playBGM = play(bgm, true);
const playQ = play(trimEffect(song, 6), false, 1);
const playW = play(trimEffect(song, 7), false, 1);

export { playBGM, playQ, playW };
playBGM();
