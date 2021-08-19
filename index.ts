import initRegl from "regl";
const regl = initRegl();
// @ts-ignore
import vert from "./vert.glsl";
// @ts-ignore
import frag from "./frag.glsl";
import REGL from "regl";
import cubeModel from "./models/cube.json";
import asteroidModel from "./models/asteroid.json";

type Model = {
  verts: number[][];
  elements: number[][];
};

function preprocessModel(m: Model) {
  // Explode indexing
  const PositionSingle: number[][] = m.elements.flatMap(([a, b]) => [
    m.verts[a],
    m.verts[b],
  ]);
  // Duplicate vertices
  const Position: number[][] = PositionSingle.flatMap((vert) => [vert, vert]);

  // Generate sister elements and sides
  const Normal: number[][] = [];
  const Side: number[] = [];
  const Elements: number[] = [];
  for (let i = 0; i < Position.length; i += 4) {
    const v = [Position[i], Position[i + 2]];
    const normal = [v[1][0] - v[0][0], v[1][1] - v[0][1], v[1][2] - v[0][2]];
    Normal.push(normal, normal, normal, normal);
    Side.push(-1, 1, -1, 1);
    Elements.push(i, i + 1, i + 2);
    Elements.push(i + 2, i + 1, i + 3);
  }
  return {
    Position: regl.buffer(Position),
    Normal: regl.buffer(Normal),
    Side: regl.buffer(Side),
    Elements: regl.elements(Elements),
  };
}

type ProcessedModel = ReturnType<typeof preprocessModel>;

const models = {
  cube: preprocessModel(cubeModel),
  asteroid: preprocessModel(asteroidModel),
};

type Uniforms = {
  Time: number;
  Aspect: number;
  Translation: REGL.Vec2;
  Thickness: number;
  Scale: number;
};

type Props = {
  translation: REGL.Vec2;
  thickness: number;
  scale: number;
};

const makeMeshDrawCall = (model: ProcessedModel) =>
  regl<Uniforms, {}, Props>({
    vert,
    frag,
    primitive: "triangles",
    attributes: {
      Position: model.Position,
      Normal: model.Normal,
      Side: model.Side,
    },
    elements: model.Elements,
    uniforms: {
      Time: () => state.rotation,
      Aspect: (context) => context.viewportWidth / context.viewportHeight,
      Translation: (context, props) => props.translation,
      Thickness: (context, props) => props.thickness * 0.01 || 0.01,
      Scale: (context, props) => props.scale || 0.5,
    },
  });

const drawCube = makeMeshDrawCall(models.cube);
const drawAsteroid = makeMeshDrawCall(models.asteroid);

const state = JSON.parse(sessionStorage.getItem("state") || '"null"') || {
  rotation: 0,
  rotating: true,
};

window.onbeforeunload = () => {
  sessionStorage.setItem("state", JSON.stringify(state));
};
window.onclick = () => {
  state.rotating = !state.rotating;
};

let prevTime = null;
regl.frame((context) => {
  const dt = context.time - (prevTime || null);
  prevTime = context.time;

  if (state.rotating) {
    state.rotation += dt;
  }

  regl.clear({
    color: [0, 0, 0, 1],
  });
  drawCube({
    translation: [0, 0],
  });

  const asteroids: [number, number][] = [
    [-0.8, 0],
    [0.8, 0],
    [-0.6, -0.5],
    [-0.8, 0],
    [0.5, 0.8],
  ];
  asteroids.forEach((translation) =>
    drawAsteroid({
      translation,
      scale: 0.2,
      thickness: 0.2,
    })
  );
});
