import initRegl from "regl";
const regl = initRegl();
// @ts-ignore
import vert from "./vert.glsl";
// @ts-ignore
import frag from "./frag.glsl";
import REGL from "regl";

type Uniforms = {
  Tick: number;
  Aspect: number;
  Translation: REGL.Vec2;
};

type Props = {
  translation: REGL.Vec2;
};

const drawTriangle = regl<Uniforms, {}, Props>({
  vert,
  frag,
  primitive: "triangles",
  attributes: {
    Position: regl.buffer([
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ]),
  },
  elements: regl.elements([0, 1, 2, 2, 1, 3]),
  uniforms: {
    Tick: ({ tick }) => tick,
    Aspect: (context) => context.viewportWidth / context.viewportHeight,
    Translation: (_context, props) => props.translation,
  },
});

regl.frame(() => {
  regl.clear({
    color: [0, 0, 0, 1],
  });
  drawTriangle([
    {
      translation: [0.5, 0],
    },
    {
      translation: [0, 0],
    },
    {
      translation: [-0.5, 0],
    },
  ]);
});
