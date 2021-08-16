import initRegl from "regl";
const regl = initRegl();
// @ts-ignore
import vert from "./vert.glsl";
// @ts-ignore
import frag from "./frag.glsl";

const drawTriangle = regl({
  vert,
  frag,
  primitive: "triangles",
  attributes: {
    position: regl.buffer([
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ]),
  },
  elements: regl.elements([0, 1, 2, 2, 1, 3]),
});

regl.frame(() => {
  regl.clear({
    color: [0, 0, 0, 1],
  });
  drawTriangle();
});
