import initRegl from "regl";
const regl = initRegl();
// @ts-ignore
import vert from "./vert.glsl";
// @ts-ignore
import frag from "./frag.glsl";
import REGL from "regl";

type Uniforms = {
  Time: number;
  Aspect: number;
  Translation: REGL.Vec2;
  Thickness: number;
};

type Props = {
  translation: REGL.Vec2;
};

let startTime: number = JSON.parse(sessionStorage.getItem("startTime") || "0")

const x1 = -0.6, y1 = -0.6, z1=0, x2=0.2, y2=0.5, z2=0;

const drawMeshLine = regl<Uniforms, {}, Props>({
  vert,
  frag,
  primitive: "triangles",
  attributes: {
    Position: regl.buffer([
      [x1, y1, z1],
      [x1, y1, z1],
      [x2, y2, z2],
      [x2, y2, z2],
    ]),
    SisterPosition: regl.buffer([
      [x2, y2, z2],
      [x2, y2, z2],
      [x1, y1, z1],
      [x1, y1, z1],
    ]),
    Side: regl.buffer([
      1, -1, 1, -1
    ])
  },
  elements: regl.elements([
    0, 1, 2, 0, 2, 3
  ]),
  uniforms: {
    Time: ({ time }) => time+startTime,
    Aspect: (context) => context.viewportWidth / context.viewportHeight,
    Translation: [0, 0],
    Thickness: 0.03,
  }
})

let currentTime = 0;

window.onbeforeunload = () => {
  sessionStorage.setItem("startTime", JSON.stringify(startTime+currentTime))
}

regl.frame((context) => {
  currentTime = context.time;
  regl.clear({
    color: [0, 0, 0, 1],
  });
  drawMeshLine();
});
