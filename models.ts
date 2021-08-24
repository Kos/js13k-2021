import { Vec2, Vec3 } from "regl";
import regl, { vert, frag } from "./regl";

import REGL from "regl";
import cubeModel from "./models/cube.json";
import asteroidModel from "./models/asteroid.json";
import leshipModel from "./models/leship.json";

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

// Fix orientation that I messed up earlier
leshipModel.verts.forEach((vert) => {
  [vert[2], vert[1]] = [vert[1], -vert[2]];
  vert[1] -= 0.5;
});

const models = {
  cube: preprocessModel(cubeModel),
  asteroid: preprocessModel(asteroidModel),
  leship: preprocessModel(leshipModel),
};

type Uniforms = {
  Translation: REGL.Vec2;
  Rotation: number;
  RotationY: number;
  RotationZ: number;
  Thickness: number;
  Scale: number;
  Aspect: number;
  Color: REGL.Vec3;
};

type Props = {
  translation: REGL.Vec2;
  rotation: number;
  rotationY: number;
  rotationZ: number;
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
      RotationY: (context, props) => props.rotationY || 0,
      RotationZ: (context, props) => props.rotationZ || 0,
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

export { drawCube, drawAsteroid, drawLeship };
