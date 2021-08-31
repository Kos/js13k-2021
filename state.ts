import { Vec2, Vec3 } from "regl";
import { createSolutionBuilder } from "typescript";
import input from "./input";
import { makeExhaust, TParticleEffect } from "./particles";
const { cos, sin, random } = Math;
const r1 = () => random() * 0.1;
const r2 = () => random() * 0.2;

type TAsteroid = {
  pos: Vec2;
  vec: Vec2;
  rotation: number;
  color: Vec3;
  collides?: boolean;
  colliderSize: number;
};

type Bullet = {
  pos: Vec2;
  vec: Vec2;
  rotation: number;
  life: number;
};

type State = {
  rotation: number;
  asteroids: TAsteroid[];
  bullets: Bullet[];
  ship: {
    pos: Vec2;
    vec: Vec2;
    thrust: number;
    angle: number;
    collides?: boolean;
    colliderSize: number;
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
      colliderSize: 1.6,
    });
  },
};

// initial state

const state: State = {
  asteroids: [],
  bullets: [],
  rotation: 0,
  ship: {
    pos: [0, 0],
    vec: [0, 0],
    thrust: 0,
    angle: 1,
    colliderSize: 0.5,
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

  state.ship.collides = false;
  state.asteroids.forEach((a) => {
    a.pos[0] += a.vec[0] * dt;
    a.pos[1] += a.vec[1] * dt;
    wraparound(a.pos);
    a.rotation += dt;
    a.collides = false;
    collide(a, state.ship);
  });
  state.bullets = state.bullets.flatMap((b) => {
    b.pos[0] += b.vec[0] * dt;
    b.pos[1] += b.vec[1] * dt;
    wraparound(b.pos);
    b.life -= dt;
    if (b.life > 0) {
      return [b];
    }
    return [];
  });

  updateShip(state.ship, dt);
}

let shipParticles: TParticleEffect = null;

function updateShip(s: TShip, dt: number) {
  const sens = 4;
  const accel = 48;
  s.angle += (input.right - input.left) * sens * dt;
  const si = sin(s.angle),
    co = cos(s.angle);
  if (input.thrust) {
    s.vec[0] += accel * dt * si;
    s.vec[1] += accel * dt * co;
  }
  s.thrust += (input.right - input.left) * dt * 4;
  s.vec[0] *= Math.pow(0.5, dt * 2);
  s.vec[1] *= Math.pow(0.5, dt * 2);
  s.thrust *= Math.pow(0.5, dt * 3);

  s.pos[0] += s.vec[0] * dt;
  s.pos[1] += s.vec[1] * dt;
  wraparound(s.pos);

  if (!shipParticles) shipParticles = makeExhaust();
  shipParticles.pos = [s.pos[0] - si * 0.6, s.pos[1] - co * 0.6];
  shipParticles.vec = [s.vec[0] - si * 10, s.vec[1] - co * 10];
  shipParticles.variance = 3;
  shipParticles.rate = input.thrust ? 0.02 : 100;
  shipParticles.update(dt);

  if (input.fire) {
    const bullet: Bullet = {
      life: 1,
      pos: [s.pos[0] + si, s.pos[1] + co],
      vec: [si * 16 + s.vec[0], co * 16 + s.vec[1]],
      rotation: s.angle,
    };
    state.bullets.push(bullet);
  }
}

function collide(a: TAsteroid, s: TShip) {
  const sq = (a) => a * a;
  const dist2 = sq(a.pos[0] - s.pos[0]) + sq(a.pos[1] - s.pos[1]);
  const rng2 = sq(a.colliderSize + s.colliderSize);
  if (dist2 < rng2) {
    a.collides = s.collides = true;
  }
}

export { shipParticles };

function wraparound(p: Vec2) {
  // wraparound with a little deadzone for simplicity
  // idea: different deadzone for different objects
  if (p[0] > 17) p[0] -= 34;
  if (p[0] < -17) p[0] += 34;
  if (p[1] > 10) p[1] -= 20;
  if (p[1] < -10) p[1] += 20;
}

// @ts-ignore
window.state = state;
export { state, step };
