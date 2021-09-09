import { max } from "./math";
import { makeMeshDrawCall, preprocessModel, Props, TModel } from "./models";
import { gl } from "./regl";
const font: Record<string, number[][]> = {
  A: [
    [-3, 0, 0, 9, 3, 0],
    [-1, 5, 1, 5],
  ],
  B: [[-2, 0, -2, 9, 1, 9, 3, 7, 1, 5, 3, 3, 0, 0, 0, 0, -3]],
  C: [[2, 9, -1, 9, -2, 7, -2, 2, 0, 0, 2, 0]],
  D: [[-2, 9, 0, 9, 2, 7, 2, 3, -1, 0, -2, 0, -2, 9]],
  E: [
    [2, 8, 2, 9, -2, 9, -2, 0, 2, 0, 2, 1],
    [-2, 5, 1, 5],
  ],
  F: [
    [2, 8, 2, 9, -2, 9, -2, 0],
    [-2, 5, 1, 5],
  ],
  G: [[2, 9, -1, 9, -2, 7, -2, 2, 0, 0, 2, 0, 3, 4, 1, 4]],
  H: [
    [-3, 9, -2, 9, -2, 0, -3, 0],
    [3, 9, 2, 9, 2, 0, 3, 0],
    [-2, 5, 2, 5],
  ],
  I: [[0, 9.5, 0, -0.5]],
  J: [[1, 9, 1, 1, 0, 0, -1, 0, -2, 1, -2, 2]],
  K: [
    [-2, 9, -2, 0],
    [-2, 5, 2, 9],
    [-2, 5, 2, 0],
  ],
  L: [[-2, 9, -2, 0, 1, 0, 1, 1]],
  M: [[-2, 0, -2, 9, 0, 3, 2, 9, 2, 0]],
  N: [[-2, 0, -2, 9, 2, 0, 2, 9]],
  O: [[-2, 2, -2, 7, -1, 9, 1, 9, 2, 7, 2, 2, 1, 0, -1, 0, -2, 2]],
  P: [[-2, 0, -2, 9, 1, 9, 2, 8, 2, 6, 0, 5, -2, 5]],
  Q: [
    [-2, 2, -2, 7, -1, 9, 1, 9, 2, 7, 2, 2, 1, 0, -1, 0, -2, 2],
    [0, 2, 3, 0],
  ],
  R: [[-2, 0, -2, 9, 1, 9, 2, 8, 2, 6, 0, 5, -2, 5, 2, 0]],
  S: [[2, 8, 1, 9, -1, 9, -2, 7, 2, 3, 2, 2, 1, 0, -1, 0, -2, 2]],
  T: [
    [0, 0, 0, 9],
    [-2, 8, -2, 9, 2, 9, 2, 8],
  ],
  U: [[-2, 9, -2, 1, -1, 0, 1, 0, 2, 1, 2, 9]],
  V: [[-3, 9, -2, 9, 0, 0, 2, 9, 3, 9]],
  W: [[-3, 9, -2, 0, 0, 9, 2, 0, 3, 9]],
  X: [
    [-2, 9, 2, 0],
    [2, 9, -2, 0],
  ],
  Y: [
    [-2, 9, 0, 5, 2, 9],
    [0, 5, 0, 0],
  ],
  Z: [[-2, 8, -2, 9, 2, 9, -2, 0, 2, 0, 2, 1]],
  0: [
    [-2, 2, -2, 7, -1, 9, 1, 9, 2, 7, 2, 2, 1, 0, -1, 0, -2, 2],
    [1, 8, -1, 1],
  ],
  1: [
    [-2, 5, 0, 9, 0, 0],
    [-2, 0, 2, 0],
  ],
  2: [[-2, 7, 0, 9, 2, 7, -2, 0, 2, 0]],
  3: [[-2, 7, 0, 9, 2, 7, 0, 5, 2, 2, 0, 0, -2, 2]],
  4: [
    [1, 9, -3, 3, 2, 3],
    [0, 4, 0, 0],
  ],
  5: [[2, 9, -2, 9, -2, 6, 1, 6, 2, 3, 0, 0, -2, 2]],
  6: [[0, 9, -2, 7, -2, 2, 0, 0, 2, 2, 2, 5, -2, 5]],
  7: [
    [-2, 9, 2, 9, -1, 0],
    [-2, 5, 2, 5],
  ],
  8: [[0, 9, 2, 7, -2, 3, 0, 0, 2, 3, -2, 7, 0, 9]],
  9: [[2, 6, 0, 4, -2, 6, 0, 9, 2, 6, 2, 2, -1, 0]],
  "/": [[2, 9, -2, 0]],
  ".": [[0, 0, 1, 0]],
};

function makeTextModel(text: string): TModel {
  const verts: number[][] = [],
    elements: number[][] = [];
  let caret = 0;
  let dy = 0;
  for (const letter of text.toUpperCase()) {
    const dx = caret;
    caret += 5.5;
    if (letter === "\n") {
      caret = 0;
      dy -= 11;
    }
    const glyph = font[letter];
    if (!glyph) continue;
    glyph.forEach((stroke) => {
      for (let i = 0; i < stroke.length; i += 2) {
        // add vertex
        verts.push([stroke[i] + dx, stroke[i + 1] + dy, 0]);
        // if second or further vertex, add element pair
        if (i) {
          elements.push([verts.length - 2, verts.length - 1]);
        }
      }
    });
  }
  // Centering
  const offset = max(...verts.map((x) => x[0]));
  for (let a of verts) {
    a[0] -= offset / 2;
  }
  return { verts, elements };
}

export function makeTextDrawcall(text: string) {
  return makeMeshDrawCall(preprocessModel(makeTextModel(text)));
}

export function makeOneOffText(text: string) {
  const m = preprocessModel(makeTextModel(text));
  return (props: Props) => {
    makeMeshDrawCall(m)(props);
    [m.Elements.buffer, m.Normal.buf, m.Position.buf, m.Side.buf].map((x) =>
      gl.deleteBuffer(x)
    );
  };
}
