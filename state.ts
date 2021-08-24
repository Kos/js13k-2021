import { Vec2, Vec3 } from "regl";
import input from "./input";
const { cos, sin, random } = Math;
const r1 = () => random() * 0.1;
const r2 = () => random() * 0.2;

type Asteroid = {
  pos: Vec2;
  vec: Vec2;
  rotation: number;
  color: Vec3;
};

type State = {
  rotation: number;
  asteroids: Asteroid[];
  ship: {
    pos: Vec2;
    vec: Vec2;
    thrust: number;
    angle: number;
  };
};

type TShip = State["ship"];

// mutators

export const mutators = {
  newAsteroid() {
    const x = random() * 3.14 * 2;
    state.asteroids.push({
      pos: [0, 0],
      vec: [cos(x) * 4, sin(x) * 4],
      rotation: 0,
      color: [0.7 + r2(), 0.4 + r2(), 0.1 + r2()],
    });
  },
};

// initial state

const state: State = {
  asteroids: [],
  rotation: 0,
  ship: {
    pos: [0, 0],
    vec: [0, 0],
    thrust: 0,
    angle: 1,
  },
};

// save state on refresh

Object.assign(state, JSON.parse(sessionStorage.getItem("state") || '"{}"'));
window.onbeforeunload = () => {
  sessionStorage.setItem("state", JSON.stringify(state));
};

// Step

function step(dt) {
  state.rotation += dt;

  state.asteroids.forEach((a) => {
    a.pos[0] += a.vec[0] * dt;
    a.pos[1] += a.vec[1] * dt;
    wraparound(a.pos);
    a.rotation += dt;
  });

  updateShip(state.ship, dt);
}

function updateShip(s: TShip, dt: number) {
  const sens = 4;
  const accel = 48;
  s.angle += (input.right - input.left) * sens * dt;
  if (input.thrust) {
    s.vec[0] += accel * dt * sin(s.angle);
    s.vec[1] += accel * dt * cos(s.angle);
  }
  s.thrust += (input.right - input.left) * dt * 4;
  s.vec[0] *= Math.pow(0.5, dt * 2);
  s.vec[1] *= Math.pow(0.5, dt * 2);
  s.thrust *= Math.pow(0.5, dt * 3);

  s.pos[0] += s.vec[0] * dt;
  s.pos[1] += s.vec[1] * dt;
  wraparound(s.pos);
}

function wraparound(p: Vec2) {
  // wraparound with a little deadzone for simplicity
  if (p[0] > 17) p[0] -= 34;
  if (p[0] < -17) p[0] += 34;
  if (p[1] > 10) p[1] -= 20;
  if (p[1] < -10) p[1] += 20;
}

export { state, step };
