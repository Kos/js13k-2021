import initRegl from "regl";
const regl = initRegl();
// @ts-ignore
import vert from "./vert.glsl";
// @ts-ignore
import frag from "./frag.glsl";
import REGL from "regl";
import uhModel from "./uh.json"


type Model = {
  verts: number[][];
  elements: number[][];
}

function preprocessModel(m: Model) {
  // Explode indexing
  const PositionSingle: number[][] = m.elements.flatMap(([a, b]) => [m.verts[a], m.verts[b]]);
  // Duplicate vertices
  const Position: number[][] = PositionSingle.flatMap(vert => [vert, vert]);

  // Generate sister elements and sides
  const SisterPosition: number[][] = [];
  const Side: number[] = [];
  const Elements: number[] = [];
  for (let i=0; i<Position.length; i+=4) {
    SisterPosition.push(Position[i+2], Position[i+2], Position[i], Position[i]);
    Side.push(1, -1, 1, -1);
    Elements.push(i, i+1, i+2, i, i+2, i+3);
  }
  return {
    Position: regl.buffer(Position),
    SisterPosition: regl.buffer(SisterPosition),
    Side: regl.buffer(Side),
    Elements: regl.elements(Elements),
  }
}
const uhPreprocessed = preprocessModel(uhModel);

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

const drawMeshLine = regl<Uniforms, {}, Props>({
  vert,
  frag,
  primitive: "triangles",
  attributes: {
    Position: uhPreprocessed.Position,
    SisterPosition: uhPreprocessed.SisterPosition,
    Side: uhPreprocessed.Side,
  },
  elements: uhPreprocessed.Elements,
  uniforms: {
    Time: ({ time }) => time+startTime,
    Aspect: (context) => context.viewportWidth / context.viewportHeight,
    Translation: [0, 0],
    Thickness: 0.01,
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
