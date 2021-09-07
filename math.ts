const { cos, sin, random, PI, pow, min, max, sqrt, sign } = Math;
const r1 = () => random() * 0.1;
const r2 = () => random() * 0.2;
const r11 = () => random() * 2 - 1;
const sq = (x) => x * x;

const TAU = 2 * PI; // what?
function lerp(a: number, b: number, c: number) {
  c = max(0, min(1, c));
  return a * (1 - c) + b * c;
}

export {
  cos,
  sin,
  random,
  TAU,
  pow,
  min,
  max,
  sq,
  sqrt,
  r1,
  r2,
  r11,
  lerp,
  sign,
};
