import initRegl, { Vec2, Vec3 } from "regl";
const regl = initRegl(document.getElementById("C"));
// @ts-ignore
import vert from "./vert.glsl";
// @ts-ignore
import frag from "./frag.glsl";
import REGL from "regl";
import cubeModel from "./models/cube.json";
import asteroidModel from "./models/asteroid.json";
import leshipModel from "./models/leship.json";
const { cos, sin, random } = Math;
const r1 = () => random() * 0.1;
const r2 = () => random() * 0.2;

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
  leship: preprocessModel(leshipModel),
};

type Uniforms = {
  Translation: REGL.Vec2;
  Rotation: number;
  Thickness: number;
  Scale: number;
  Aspect: number;
  Color: REGL.Vec3;
};

type Props = {
  translation: REGL.Vec2;
  rotation: number;
  thickness: number;
  scale: number;
  color: REGL.Vec3;
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
      Rotation: (context, props) => props.rotation || 0,
      Aspect: (context) => context.viewportWidth / context.viewportHeight,
      Translation: (context, props) => props.translation,
      Thickness: (context, props) => props.thickness * 0.01 || 0.01,
      Scale: (context, props) => props.scale || 0.5,
      Color: (context, props) => props.color || [1, 1, 0],
    },
  });

const drawCube = makeMeshDrawCall(models.cube);
const drawAsteroid = makeMeshDrawCall(models.asteroid);
const drawLeship = makeMeshDrawCall(models.leship);

// STATE

type Asteroid = {
  pos: Vec2;
  vec: Vec2;
  rotation: number;
  color: Vec3;
};

type State = {
  rotation: number;
  asteroids: Asteroid[];
};

// mutators

function newAsteroid() {
  const x = random() * 3.14 * 2;
  state.asteroids.push({
    pos: [0, 0],
    vec: [cos(x) * 4, sin(x) * 4],
    rotation: 0,
    color: [0.7 + r2(), 0.4 + r2(), 0.1 + r2()],
  });
}

// initial state

const state: State = {
  asteroids: [],
  rotation: 0,
  ...JSON.parse(sessionStorage.getItem("state") || '"{}"'),
};

window.onbeforeunload = () => {
  sessionStorage.setItem("state", JSON.stringify(state));
};
window.addEventListener("keypress", (e) => {
  if (e.key === "a") {
    newAsteroid();
  }
  if (e.key === "A") {
    state.asteroids = [];
  }
});

if (state.asteroids.length === 0) {
  newAsteroid();
}

let prevTime = null;

// FRAME

function step(dt) {
  state.asteroids.forEach((a) => {
    a.pos[0] += a.vec[0] * dt;
    a.pos[1] += a.vec[1] * dt;
    // wraparound with a little deadzone for simplicity
    if (a.pos[0] > 17) a.pos[0] -= 34;
    if (a.pos[0] < -17) a.pos[0] += 34;
    if (a.pos[1] > 10) a.pos[1] -= 20;
    if (a.pos[1] < -10) a.pos[1] += 20;
    a.rotation += dt;
  });
}

regl.frame((context) => {
  const dt = context.time - (prevTime || null);
  prevTime = context.time;

  step(dt);

  state.rotation += dt;

  regl.clear({
    color: [0, 0, 0, 1],
  });

  state.asteroids.forEach((a) =>
    drawAsteroid({
      translation: a.pos,
      rotation: a.rotation + state.rotation,
      scale: 0.1,
      thickness: 0.2,
      color: a.color,
    })
  );

  const cubes: Vec2[] = [
    [-16, -9],
    [-16, 9],
    [16, -9],
    [16, 9],
    [0, 0],
  ];
  cubes.forEach((transform) =>
    drawCube({
      translation: transform,
      rotation: state.rotation,
      scale: 0.1,
      thickness: 0.2,
    })
  );
});
