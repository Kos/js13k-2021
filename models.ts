import type { Vec2, Vec3 } from "regl";
import regl, { vert, frag, Uniforms } from "./regl";

import cubeModel from "./models/cube.json";
import asteroidModel from "./models/asteroid.json";
import asteroid2Model from "./models/asteroid2.json";
import asteroid3Model from "./models/asteroid3.json";
import leshipModel from "./models/leship.json";
const { PI, cos, sin } = Math;

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
    Position: regl.buffer(Position.flatMap((x) => x)),
    Normal: regl.buffer(Normal.flatMap((x) => x)),
    Side: regl.buffer(Side),
    Elements: regl.elements(Elements),
  };
}

function makeCircle(): Model {
  const count = 40;
  const verts = [];
  const elements = [];
  for (let i = 0; i < count; ++i) {
    const angle = (2 * PI * i) / count;
    verts.push([cos(angle), sin(angle), 0]);
    elements.push([i, i + 1]);
  }
  elements[elements.length - 1][1] = 0;

  console.log({ verts, elements });
  return {
    verts,
    elements,
  };
}

function makeLine(): Model {
  return {
    verts: [
      [0, 0, 0],
      [0, 1, 0],
    ],
    elements: [[0, 1]],
  };
}

type ProcessedModel = ReturnType<typeof preprocessModel>;

// Fix orientation that I messed up earlier
leshipModel.verts.forEach((vert) => {
  [vert[2], vert[1]] = [vert[1], -vert[2]];
  vert[1] -= 0.8;
});

const models = {
  cube: preprocessModel(cubeModel),
  asteroid: preprocessModel(asteroidModel),
  asteroid2: preprocessModel(asteroid2Model),
  leship: preprocessModel(leshipModel),
  circle: preprocessModel(makeCircle()),
  line: preprocessModel(makeLine()),
};

export type Props = {
  translation: Vec2;
  rotation: number;
  rotationY: number;
  rotationZ: number;
  thickness: number;
  scale: number;
  color: Vec3;
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
      Life: { constant: [1] },
    },
    elements: model.Elements,
    uniforms: {
      Rotation: (context, props) => props.rotation || 0,
      RotationY: (context, props) => props.rotationY || 0,
      RotationZ: (context, props) => props.rotationZ || 0,
      Translation: (context, props) => props.translation,
      Thickness: (context, props) => props.thickness * 0.01 || 0.01,
      Scale: (context, props) => props.scale || 0.5,
      Color: (context, props) => props.color || [1, 1, 0],
      LifeMax: () => 1,
    },
  });

const drawCube = makeMeshDrawCall(preprocessModel(cubeModel));
const drawAsteroid = makeMeshDrawCall(preprocessModel(asteroidModel));
const drawAsteroid2 = makeMeshDrawCall(preprocessModel(asteroid2Model));
const drawAsteroid3 = makeMeshDrawCall(preprocessModel(asteroid3Model));
const drawLeship = makeMeshDrawCall(preprocessModel(leshipModel));
const drawCircle = makeMeshDrawCall(preprocessModel(makeCircle()));
const drawLine = makeMeshDrawCall(preprocessModel(makeLine()));

export {
  drawCube,
  drawAsteroid,
  drawAsteroid2,
  drawAsteroid3,
  drawLeship,
  drawCircle,
  drawLine,
};
