import { Vec2, Vec3 } from "regl";
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

function step(dt) {
  state.rotation += dt;

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

export { state, step };
