import { Vec2, Vec3 } from "regl";
import { playBoom, playQ, playW } from "./audio";
import input from "./input";
import { cos, max, pow, r2, random, sin, TAU } from "./math";
import {
  makeExhaust,
  makeExplosion,
  particles,
  TParticleEffect,
} from "./particles";

type TAsteroid = {
  pos: Vec2;
  vec: Vec2;
  rotation: number;
  rZ: number;
  color: Vec3;
  collides?: boolean;
  colliderSize: number;
  children: number[];
  generation: number;
  has?: "m" | "p";
};

export type TBullet = {
  pos: Vec2;
  vec: Vec2;
  rotation: number;
  life: number;
  collides?: boolean;
};

type TSign = {
  pos: Vec2;
  life: number;
  index: number;
};

type TMine = {
  pos: Vec2;
  vec: Vec2;
  life: number;
  inv: number; // invulnerability time left
  collides?: boolean;
  colliderSize: number;
};

type TState = {
  title: boolean;
  level: number;
  rotation: number;
  asteroids: TAsteroid[];
  bullets: TBullet[];
  enemyBullets: TBullet[];
  ship: {
    pos: Vec2;
    vec: Vec2;
    thrust: number;
    angle: number;
    collides?: boolean;
    colliderSize: number;
    aura: number;
    hitTimer: number;
  };
  auraSize: number;
  cooldowns: number[];
  scheduledBullets: number[];
  renderHitboxes?: boolean;
  mines: TMine[];
  signs: TSign[];
  win: number;
};

type TShip = TState["ship"];

// mutator

export function newAsteroid() {
  const x = random() * 3.14 * 2;
  const t = random() * 3.14 * 2;
  state.asteroids.push({
    pos: [cos(t) * 16, sin(t) * 9],
    vec: [cos(x) * 4, sin(x) * 4],
    rotation: 0,
    rZ: random(),
    color: [0.7 + r2(), 0.4 + r2(), 0.1 + r2()],
    colliderSize: 1.6,
    children: [4, 3],
    generation: 0,
  });
}

function baseState(): TState {
  return {
    title: false,
    level: 0,
    asteroids: [],
    bullets: [],
    enemyBullets: [],
    rotation: 0,
    ship: {
      pos: [0, 0],
      vec: [0, 0],
      thrust: 0,
      angle: 1,
      colliderSize: 0.5,
      aura: 0,
      hitTimer: 0,
    },
    auraSize: 5,
    cooldowns: [0, 0, 0],
    scheduledBullets: [],
    mines: [],
    signs: [],
    win: 0,
  };
}
export function titleScreen() {
  Object.assign(state, {
    ...baseState(),
    title: true,
    asteroids: [
      {
        pos: [-11, 2],
        vec: [0, 0],
        rotation: 0,
        rZ: random(),
        color: [0.7 + r2(), 0.4 + r2(), 0.1 + r2()],
        colliderSize: 2.6,
        children: [],
        generation: 0,
      },
      {
        pos: [11, 2],
        vec: [0, 0],
        rotation: 0,
        rZ: random(),
        color: [0.7 + r2(), 0.4 + r2(), 0.1 + r2()],
        colliderSize: 2.6,
        children: [],
        generation: 0,
      },
    ],
    mines: [
      {
        pos: [0, -2],
        vec: [0, 0],
        life: 1,
        colliderSize: 0.5,
      },
    ],
    win: 0,
  });
}

export function setLevel(n: number = 0) {
  state.title = false;
  state.level = n;
  state.asteroids = [];
  state.mines = [];
  state.win = 0;
  state.signs.push({
    index: n + 4,
    life: 2,
    pos: [0, 0],
  });
  const c = [1, 2, 2, 3, 3, 3][n];
  for (let i = 0; i < c; ++i) newAsteroid();
}

// initial state

const state: TState = baseState();

// save state on refresh

Object.assign(state, JSON.parse(sessionStorage.getItem("state") || '"{}"'));
window.onbeforeunload = () => {
  sessionStorage.setItem("state", JSON.stringify(state));
};

// Step

function step(dt) {
  state.rotation += dt;
  state.signs = state.signs.flatMap((x) => {
    x.life -= dt;
    return x.life > 0 ? [x] : [];
  });
  if (state.title) {
    // ...
    return;
  }

  state.ship.collides = false;
  [...state.asteroids, ...state.mines].forEach((a) => {
    a.pos[0] += a.vec[0] * dt;
    a.pos[1] += a.vec[1] * dt;
    wraparound(a.pos);
    // @ts-ignore
    if (a.rotation !== undefined) a.rotation += dt;
    // @ts-ignore
    if (a.life !== undefined) a.life -= dt;
    // @ts-ignore
    if (a.inv !== undefined) a.inv -= dt;
    a.collides = false;
    if (state.ship.hitTimer === 0) {
      collide(a, state.ship, state.ship.colliderSize);
    }
    if (state.ship.aura) {
      collideAura(a, state.ship, state.ship.aura);
    }
  });

  state.bullets = state.bullets.flatMap((b) => {
    b.pos[0] += b.vec[0] * dt;
    b.pos[1] += b.vec[1] * dt;
    wraparound(b.pos);
    b.life -= dt;
    if (b.life > 0 && !b.collides) {
      return [b];
    }
    return [];
  });
  state.enemyBullets = state.enemyBullets.flatMap((b) => {
    b.pos[0] += b.vec[0] * dt;
    b.pos[1] += b.vec[1] * dt;
    wraparound(b.pos);
    b.life -= dt;
    if (b.life > 0 && !b.collides) {
      return [b];
    }
    return [];
  });

  // O(n^2) party [INSERT QUADTREE HERE]
  [...state.bullets, ...state.enemyBullets].forEach((b) => {
    state.asteroids.forEach((a) => {
      collide(a, b, 0);
    });
  });
  state.bullets.forEach((b) => {
    state.mines.forEach((a) => {
      collide(a, b, 0);
    });
  });
  // end O(N^2) party
  if (state.ship.hitTimer === 0) {
    state.enemyBullets.forEach((b) => {
      collide(state.ship, b, 0);
    });
  }

  state.asteroids = state.asteroids.flatMap((a) => {
    if (!a.collides) {
      return [a];
    }
    boom(a.pos);
    const children = [...a.children];
    if (!children.length) {
      return [];
    }
    const n = children.shift();
    if (a.has === "m") {
      state.mines.push({
        pos: [...a.pos],
        vec: [random(), random()],
        colliderSize: 0.5,
        life: 3,
        inv: 1,
      });
    }
    return Array(n)
      .fill(0)
      .map((_) => {
        const x = random() * 6;
        let has: undefined | "m" | "p";
        const thres = [0, 0.25, 0.25, 0.5, 0.5, 1, 1][state.level];
        if (a.generation === 0 && random() < thres) has = "m";
        return {
          pos: [...a.pos],
          vec: [cos(x) * 4, sin(x) * 4],
          rotation: 0,
          rZ: random(),
          color: has === "m" ? [1, 0, 0] : [0.7 + r2(), 0.4 + r2(), 0.1 + r2()],
          colliderSize: a.colliderSize / 2,
          children: [...children],
          generation: a.generation + 1,
          has,
        };
      });
  });

  state.mines = state.mines.flatMap((m) => {
    if (m.collides && m.inv < 0) {
      boom(m.pos);
      return [];
    }
    if (m.life < 0) {
      // self destruct - TODO match this to music
      boom(m.pos);
      // spawn bullets
      for (let i = 0; i < TAU; i += TAU / 8) {
        [15, 8].map((v) =>
          state.enemyBullets.push({
            life: 0.6,
            pos: [...m.pos],
            vec: [sin(i) * v, cos(i) * v],
            rotation: i,
          })
        );
      }
      return [];
    }
    return [m];
  });

  updateShip(state.ship, dt);
  checkWin();
}

let shipParticles: TParticleEffect = null;

function updateShip(s: TShip, dt: number) {
  const sens = 4;
  const accel = 48;
  s.angle += (input.right - input.left) * sens * dt;
  if (s.collides) {
    s.hitTimer = 1.2;
  } else {
    s.hitTimer = max(0, s.hitTimer - dt);
  }
  const si = sin(s.angle),
    co = cos(s.angle);
  if (input.thrust) {
    s.vec[0] += accel * dt * si;
    s.vec[1] += accel * dt * co;
  }
  s.thrust += (input.right - input.left) * dt * 4;
  s.vec[0] *= pow(0.5, dt * 2);
  s.vec[1] *= pow(0.5, dt * 2);
  s.thrust *= pow(0.5, dt * 3);

  s.pos[0] += s.vec[0] * dt;
  s.pos[1] += s.vec[1] * dt;
  wraparound(s.pos);

  if (!shipParticles) shipParticles = makeExhaust();
  shipParticles.pos = [s.pos[0] - si * 0.6, s.pos[1] - co * 0.6];
  shipParticles.vec = [s.vec[0] - si * 10, s.vec[1] - co * 10];
  shipParticles.variance = 3;
  shipParticles.rate = input.thrust ? 0.02 : 100;
  shipParticles.update(dt);

  state.scheduledBullets = state.scheduledBullets.flatMap((delay) => {
    delay -= dt;
    if (delay > 0) {
      return [delay];
    } else {
      const bullet: TBullet = {
        life: 1,
        pos: [s.pos[0] + si, s.pos[1] + co],
        vec: [si * 33 + s.vec[0], co * 33 + s.vec[1]],
        rotation: s.angle,
      };
      state.bullets.push(bullet);
      return [];
    }
  });

  if (state.ship.aura) {
    state.ship.aura += dt;
    if (state.ship.aura >= 0.6) {
      state.ship.aura = 0;
    }
  }

  state.cooldowns = state.cooldowns.map((x) => max(0, x - dt));
  if (!state.ship.hitTimer) {
    if (input.skill1 && state.cooldowns[0] === 0) {
      playQ();
      state.cooldowns[0] = 0.6 * 4 - 0.2;
      state.scheduledBullets.push(0.15, 0.3, 0.45, 0.6, 0.75);
    }
    if (input.skill2 && state.cooldowns[1] === 0) {
      playW();
      state.cooldowns[1] = 0.6 * 8 - 0.2;
      state.ship.aura = 0.1;
    }
  }
}
const sq = (a: number) => a * a;

function collide(
  a: { pos: Vec2; colliderSize: number; collides?: boolean },
  s: { pos: Vec2; collides?: boolean },
  colliderSize: number
) {
  const dist2 = sq(a.pos[0] - s.pos[0]) + sq(a.pos[1] - s.pos[1]);
  const rng2 = sq(a.colliderSize + colliderSize);
  if (dist2 < rng2) {
    a.collides = s.collides = true;
  }
}

function collideAura(
  a: { pos: Vec2; colliderSize: number; collides?: boolean },
  s: { pos: Vec2; collides?: boolean },
  auraSize: number
) {
  const dist2 = sq(a.pos[0] - s.pos[0]) + sq(a.pos[1] - s.pos[1]);
  if (dist2 < sq(auraSize * state.auraSize + a.colliderSize)) {
    a.collides = true;
  }
}

function checkWin() {
  if (!state.win && ![...state.asteroids, ...state.mines].length) {
    state.win = 1;
    state.signs.push({
      index: 10 + (0 | (random() * 4)),
      life: 2,
      pos: [0, -5],
    });
    setTimeout(() => {
      if (state.level < 5) {
        setLevel(state.level + 1);
      } else {
        // nada
      }
    }, 2200);
  }
}

function boom(p: Vec2) {
  if (particles.length < 20) particles.push(...makeExplosion(p));
  playBoom();
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

window.addEventListener("keyup", (e) => {
  if (e.code === "KeyQ" && state.title) {
    setLevel();
  }
  if (e.key === "Escape") {
    titleScreen();
  }
});

// @ts-ignore
window.state = state;
export { state, step };
