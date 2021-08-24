export default function lerp(a: number, b: number, c: number) {
  c = Math.max(0, Math.min(1, c));
  return a * (1 - c) + b * c;
}
