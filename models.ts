import type { Vec2, Vec3 } from "regl";
import regl, { vert, frag, Uniforms } from "./regl";

import cubeModel from "./models/cube.json";
import asteroidModel from "./models/asteroid.json";
import asteroid2Model from "./models/asteroid2.json";
import asteroid3Model from "./models/asteroid3.json";
import leshipModel from "./models/leship.json";
import { cos, sin, sqrt, TAU } from "./math";

export type TModel = {
  verts: number[][];
  elements: number[][];
};

export function preprocessModel(m: TModel) {
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

function makeCircle(): TModel {
  const count = 40;
  const verts = [];
  const elements = [];
  for (let i = 0; i < count; ++i) {
    const angle = (TAU * i) / count;
    verts.push([cos(angle), sin(angle), 0]);
    elements.push([i, i + 1]);
  }
  elements[elements.length - 1][1] = 0;

  return {
    verts,
    elements,
  };
}

function makeLine(): TModel {
  return {
    verts: [
      [0, 0, 0],
      [0, 1, 0],
    ],
    elements: [[0, 1]],
  };
}

function makeMine(): TModel {
  const verts: number[][] = [],
    elements: number[][] = [];
  for (let h = -0.7; h <= 0.8; h += 0.7) {
    for (let a = 0; a < TAU; a += 1.2) {
      const r = sqrt(1 - h * h);
      verts.push([cos(a) * r, h, sin(a) * r]);
      verts.push([cos(a) * (r * 0.5), h * 0.5, sin(a) * (r * 0.5)]);
      const l = verts.length;
      elements.push([l - 2, l - 1]);
    }
  }
  return { verts, elements };
}

function makeEye(): TModel {
  return {
    verts: [
      [-2, 0, 0],
      [-2, -1, 0],
      [0, -2, 0],
      [2, -1, 0],
      [2, 0, 0],
      [2, 1, 0],
      [0, 2, 0],
      [-2, 1, 0],
      // ...
      [-0.5, -1, 0],
      [-0.5, 1, 0],
      [0.5, 1, 0],
      [0.5, -1, 0],
    ],
    elements: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 0],
      // here
      [8, 9],
      [9, 10],
      [10, 11],
      [11, 8],
    ],
  };
}

type ProcessedModel = ReturnType<typeof preprocessModel>;

// Fix orientation that I messed up earlier
leshipModel.verts.forEach((vert) => {
  [vert[2], vert[1]] = [vert[1], -vert[2]];
  vert[1] -= 0.8;
});
cubeModel.verts.forEach((vert) => (vert[1] -= 0.5));

export type Props = {
  translation: Vec2;
  rotation?: number;
  rotationY?: number;
  rotationZ?: number;
  thickness?: number;
  scale?: number;
  color?: Vec3;
  lights?: Vec2[];
  lightColors?: Vec3[];
};

export function makeMeshDrawCall(
  model: ProcessedModel,
  count?: number
): (props: Props) => void {
  return regl<Uniforms, {}, Props>({
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
    // @ts-ignore
    count: count ? (context, props) => count : undefined,
    uniforms: {
      Translation: (context, props) => props.translation,
      Rotation: (context, props) => props.rotation || 0,
      RotationY: (context, props) => props.rotationY || 0,
      RotationZ: (context, props) => props.rotationZ || 0,
      Thickness: (context, props) => props.thickness * 0.01 || 0.01,
      Scale: (context, props) => props.scale || 0.5,
      Color: (context, props) => props.color || [1, 1, 0],
      LifeMax: () => 1,
    },
  });
}

const drawCube = makeMeshDrawCall(preprocessModel(cubeModel));
const drawAsteroid = makeMeshDrawCall(preprocessModel(asteroidModel));
const drawAsteroid2 = makeMeshDrawCall(preprocessModel(asteroid2Model));
const drawAsteroid3 = makeMeshDrawCall(preprocessModel(asteroid3Model));
const drawLeship = makeMeshDrawCall(preprocessModel(leshipModel));
const drawCircle = makeMeshDrawCall(preprocessModel(makeCircle()));
const drawLine = makeMeshDrawCall(preprocessModel(makeLine()));
const drawMine = makeMeshDrawCall(preprocessModel(makeMine()));
const drawEye = makeMeshDrawCall(preprocessModel(makeEye()));
const drawEye2 = makeMeshDrawCall(preprocessModel(makeEye()), 6 * 4);

export {
  drawCube,
  drawAsteroid,
  drawAsteroid2,
  drawAsteroid3,
  drawLeship,
  drawCircle,
  drawLine,
  drawMine,
  drawEye,
  drawEye2,
};
