import { Vec2, Vec3 } from "regl";
import {
  currentBeatFraction,
  playBoom,
  playE,
  playQ,
  playS,
  playW,
} from "./audio";
import input from "./input";
import { cos, max, pow, r11, r2, random, sign, sin, sq, TAU } from "./math";
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
  has?: "m" | "p" | "a";
};

type TPowerup = {
  pos: Vec2;
  vec: Vec2;
  collides?: boolean;
};

export type TBullet = {
  pos: Vec2;
  vec: Vec2;
  rotation: number;
  life: number;
  collides?: boolean;
};

type TMortarBlast = {
  pos: Vec2;
  life: number;
  size: number;
};

type TSign = {
  pos: Vec2;
  life: number;
  index: number;
  size?: number;
  color?: Vec3;
  v?: number;
};

type TMine = {
  pos: Vec2;
  vec: Vec2;
  life: number;
  inv: number; // invulnerability time left
  collides?: boolean;
  colliderSize: number;
};

type TAlien = {
  pos: Vec2;
  vec: Vec2;
  hits: number;
  inv: number; // invulnerability time left
  collides?: boolean;
  colliderSize: number;
  shootTimer: number;
  shootCooldown?: number;
  shootAngle?: number;
};

type TState = {
  title: boolean;
  level: number;
  rotation: number;
  asteroids: TAsteroid[];
  bullets: TBullet[];
  mortars: TBullet[];
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
    powerups: number;
  };
  auraSize: number;
  blasts: TMortarBlast[];
  cooldowns: number[];
  scheduledBullets: number[];
  scheduledMortar?: number;
  renderHitboxes?: boolean;
  mines: TMine[];
  aliens: TAlien[];
  signs: TSign[];
  powerups: TPowerup[];
  win: number;
  score: number;
  combo: number;
  hp: number;
};

type TShip = TState["ship"];

// mutators

export function newAsteroid(args = {}) {
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
    ...args,
  });
}

function baseState(): TState {
  return {
    title: false,
    level: 0,
    asteroids: [],
    bullets: [],
    mortars: [],
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
      powerups: 0,
    },
    auraSize: 5,
    blasts: [],
    cooldowns: [0, 0, 0],
    scheduledBullets: [],
    mines: [],
    aliens: [],
    signs: [],
    powerups: [],
    win: 0,
    score: 0,
    combo: 0,
    hp: 9,
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
  state.aliens = [];
  state.win = 0;
  state.ship.pos = [0, 0];
  state.ship.vec = [0, 0];
  state.signs.push({
    index: n + 4,
    life: 2,
    pos: [0, 0],
  });
  const asteroidCount = [1, 2, 2, 3, 3, 3][n];
  const extraAsteroids = [[], ["p"], ["p"], ["p", "a"], ["p"], ["a"]];
  for (let i = 0; i < asteroidCount; ++i) newAsteroid();
  if (n > 0)
    Array(n + 1)
      .fill(0)
      .map((_, i) =>
        newAsteroid({
          colliderSize: 1,
          children: [5],
          generation: 1,
          has: extraAsteroids[n][i],
          color: extraAsteroids[n][i] == "a" ? [1, 1, 1] : undefined,
        })
      );
}

// initial state

const state: TState = baseState();
titleScreen();

// save state on refresh

Object.assign(state, JSON.parse(sessionStorage.getItem("state") || '"{}"'));
window.onbeforeunload = () => {
  sessionStorage.setItem("state", JSON.stringify(state));
};

// Step

function step(dt: number) {
  if (dt > 1) return;
  state.rotation += dt;
  state.signs = state.signs.flatMap((x) => {
    x.life -= dt;
    return x.life > 0 ? [x] : [];
  });
  if (state.title) {
    return;
  }

  state.ship.collides = false;
  [...state.asteroids, ...state.mines, ...state.aliens].forEach((a) => {
    move(a, dt);
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
      collideAura(a, state.ship, state.ship.aura * state.auraSize);
    }
    state.blasts.forEach((b) => {
      collideAura(a, b, b.size * 3);
    });
  });
  state.powerups = state.powerups.flatMap((p) => {
    move(p, dt);
    collide(state.ship, p, 1);
    if (p.collides) {
      state.ship.collides = false; //:)
      applyPowerup();
      return [];
    }
    return [p];
  });

  state.bullets = state.bullets.flatMap((b) => {
    move(b, dt);
    b.life -= dt;
    if (b.life > 0 && !b.collides) {
      return [b];
    }
    return [];
  });
  state.mortars = state.mortars.flatMap((m) => {
    move(m, dt);
    m.life -= dt;
    if (m.life > 0) {
      return [m];
    } else {
      state.blasts.push({
        pos: m.pos,
        life: 0.3,
        size: 0,
      });
      return [];
    }
  });
  state.enemyBullets.map((b) => {
    move(b, dt);
    b.life -= dt;
  });

  // O(n^2) party [INSERT QUADTREE HERE]
  [...state.bullets, ...state.enemyBullets].forEach((b) => {
    state.asteroids.forEach((a) => {
      collide(a, b, 0);
    });
  });
  state.bullets.forEach((b) => {
    [...state.mines, ...state.aliens].forEach((a) => {
      collide(a, b, 0);
    });
  });
  // end O(N^2) party
  if (state.ship.hitTimer === 0) {
    state.enemyBullets.forEach((b) => {
      collide(state.ship, b, 0);
    });
  }

  state.enemyBullets = state.enemyBullets.flatMap((b) => {
    if (b.life > 0 && !b.collides) {
      return [b];
    }
    if (state.ship.collides) {
      boom(b.pos);
    }
    return [];
  });

  state.asteroids = state.asteroids.flatMap((a) => {
    if (!a.collides) {
      return [a];
    }
    score();
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
    if (a.has === "p") {
      state.powerups.push({
        pos: [...a.pos],
        vec: [random(), random()],
      });
    }
    if (a.has === "a") {
      state.aliens.push({
        pos: [...a.pos],
        vec: [random(), random()],
        inv: 1,
        colliderSize: 1,
        hits: state.level < 5 ? 3 : 5,
        shootTimer: 0.6 * 4,
      });
    }
    return Array(n)
      .fill(0)
      .map((_) => {
        const x = random() * 6;
        let has: undefined | "m" | "p";
        const thres = [0, 0, 0.5, 0, 0.8, 0.3][state.level];
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
      score(25);
      boom(m.pos);
      return [];
    }
    if (m.life < 0 && currentBeatFraction() < 0.05) {
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

  state.aliens = state.aliens.flatMap((a) => {
    if (a.collides && a.inv < 0 && a.hits === 0) {
      booms(a.pos, 4);
      return [];
    }
    if (a.collides && a.inv < 0) {
      score(50);
      // teleport
      boom(a.pos);
      a.hits -= 1;
      a.pos = [r11() * 6, r11() * 3];
      // Reset shot timer
      a.shootTimer = (4 - currentBeatFraction()) * 0.6;
      a.shootCooldown = 0;
      boom(a.pos);
      // Small invulnerability to avoid lucky hits after teleport
      a.inv = 0.3;
    }
    a.shootTimer -= dt;
    if (a.shootTimer <= 0 && state.hp) {
      playS();
      a.shootTimer = (4 - currentBeatFraction()) * 0.6;
      a.shootCooldown = 1.2;
      a.shootAngle = Math.atan2(
        state.ship.pos[0] - a.pos[0],
        state.ship.pos[1] - a.pos[1]
      );
    }
    a.shootCooldown = max(0, a.shootCooldown - dt);
    if (
      a.shootCooldown > 0.1 &&
      a.shootCooldown <= 0.6 &&
      !state.ship.hitTimer &&
      state.hp
    ) {
      // hit moment, scan collision
      const co = cos(a.shootAngle),
        si = sin(a.shootAngle);
      for (let i = 0; i < 30; ++i) {
        const p: Vec2 = [a.pos[0] + si * i, a.pos[1] + co * i];
        collide(state.ship, { pos: p }, 0);
        if (state.ship.collides) {
          boom(state.ship.pos);
          break;
        }
      }
    }
    if (a.shootTimer) return [a];
  });

  updateShip(state.ship, dt);
  checkWin();
}

let shipParticles: TParticleEffect = null;

function updateShip(s: TShip, dt: number) {
  const sens = 4;
  const accel = 48;
  s.angle += (input.right - input.left) * sens * dt;
  if (state.hp > 0) {
    if (s.collides) {
      state.combo = 0;
      if (--state.hp == 0) {
        booms(s.pos, 5);
        return;
      }
      s.hitTimer = 1.2;
    } else {
      s.hitTimer = max(0, s.hitTimer - dt);
    }
  }

  const si = sin(s.angle),
    co = cos(s.angle);

  if (state.hp > 0) {
    if (input.thrust) {
      s.vec[0] += accel * dt * si;
      s.vec[1] += accel * dt * co;
    }
    s.thrust += (input.right - input.left) * dt * 4;
    s.vec[0] *= pow(0.5, dt * 2);
    s.vec[1] *= pow(0.5, dt * 2);
    s.thrust *= pow(0.5, dt * 3);

    move(s, dt);
  }

  if (!shipParticles) shipParticles = makeExhaust();
  shipParticles.pos = [s.pos[0] - si * 0.6, s.pos[1] - co * 0.6];
  shipParticles.vec = [s.vec[0] - si * 10, s.vec[1] - co * 10];
  shipParticles.variance = 3;
  shipParticles.rate = state.hp && input.thrust ? 0.02 : 100;
  shipParticles.update(dt);

  if (state.hp)
    state.scheduledBullets = state.scheduledBullets.flatMap((delay) => {
      delay -= dt;
      if (delay > 0) {
        return [delay];
      } else {
        if (s.powerups < 3) {
          state.bullets.push({
            life: 1,
            pos: [s.pos[0] + si, s.pos[1] + co],
            vec: [si * 33 + s.vec[0], co * 33 + s.vec[1]],
            rotation: s.angle,
          });
        } else {
          state.bullets.push({
            life: 1,
            pos: [s.pos[0] + si + co * 0.2, s.pos[1] + co - si * 0.2],
            vec: [si * 33 + s.vec[0], co * 33 + s.vec[1]],
            rotation: s.angle,
          });
          state.bullets.push({
            life: 1,
            pos: [s.pos[0] + si - co * 0.2, s.pos[1] + co + si * 0.2],
            vec: [si * 33 + s.vec[0], co * 33 + s.vec[1]],
            rotation: s.angle,
          });
        }
        return [];
      }
    });

  if (state.hp && state.scheduledMortar) {
    state.scheduledMortar = max(0, state.scheduledMortar - dt);
    if (!state.scheduledMortar) fireMortars(s, 0.3);
  }

  if (state.ship.aura) {
    state.ship.aura += dt;
    if (state.ship.aura >= 0.6) {
      state.ship.aura = 0;
    }
  }
  state.blasts = state.blasts.flatMap((b) => {
    b.life -= dt;
    b.size += dt * 2;
    return b.life < 0 ? [] : [b];
  });

  if (state.hp) {
    state.cooldowns = state.cooldowns.map((x) => max(0, x - dt));
    const adj = currentBeatFraction() * 0.6 + 0.2;
    if (!state.ship.hitTimer) {
      if (input.skill1 && state.cooldowns[0] === 0) {
        state.cooldowns[0] = 0.6 * 2;
        if (checkBeat()) {
          state.cooldowns[0] = 0.6 * 4 - adj;
          playQ();
          state.scheduledBullets.push(0.15, 0.3, 0.45, 0.6, 0.75);
        }
      }
      if (
        input.skill2 &&
        state.cooldowns[1] === 0 &&
        state.ship.powerups >= 1
      ) {
        state.cooldowns[1] = 0.6 * 2;
        if (checkBeat()) {
          state.cooldowns[1] = 0.6 * 8 - adj;
          playW();
          state.ship.aura = 0.1;
        }
      }
      if (
        input.skill3 &&
        state.cooldowns[2] === 0 &&
        state.ship.powerups >= 2
      ) {
        state.cooldowns[2] = 0.6 * 2;
        if (checkBeat()) {
          state.cooldowns[2] = 0.6 * 8 - adj;
          playE();
          fireMortars(s);
          state.scheduledMortar = 0.6 * (3 / 16) * 4;
        }
      }
    }
  }
}

function applyPowerup() {
  if (state.ship.powerups >= 4) return;
  const v = (state.ship.powerups += 1);
  // v=1: unlocks aura
  // v=2: unlocks mortar
  // v=3: improves gun
  if (v === 4) state.auraSize *= 1.6;
  state.signs.push({
    pos: [0, 2],
    life: 0.6 * 8,
    size: 0.004,
    index: 18 + v,
  });
}

function score(n = 10) {
  if (state.hp) state.score += n + state.combo++;
}

function checkBeat(t: number = 0.2): boolean {
  const f = currentBeatFraction();
  if (f > 0.75 || f < 0.2) {
    console.debug("checkBeat", f, "true");
    return true;
  }
  const { pos } = state.ship;
  state.signs.push({
    index: 17,
    life: 0.7,
    v: 0,
    pos: [pos[0], pos[1] - sign(pos[1])],
    size: 0.0025,
    color: [1, 0.5, 0.5],
  });
  console.debug("checkBeat", f, "false");
  state.combo = 0;
  return false;
}

function fireMortars(s: TShip, o: number = 0) {
  state.mortars.push(
    ...[-0.3 - o, 0.3 + o].map((q) => ({
      pos: [...s.pos] as Vec2,
      vec: [sin(s.angle + q) * 8, cos(s.angle + q) * 8] as Vec2,
      rotation: s.angle + q,
      life: 0.6 * (7 / 16) * 4,
    }))
  );
}

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
  size: number
) {
  const dist2 = sq(a.pos[0] - s.pos[0]) + sq(a.pos[1] - s.pos[1]);
  if (dist2 < sq(size + a.colliderSize)) {
    a.collides = true;
  }
}

function checkWin() {
  if (
    !state.win &&
    state.hp && // don't advance level if died on last asteroid
    ![...state.asteroids, ...state.mines, ...state.aliens].length
  ) {
    state.win = 1;
    state.signs.push({
      index: 10 + (0 | (random() * 4)),
      life: 2,
      pos: [0, -5],
    });
    setTimeout(() => {
      if (state.level < 5) {
        setLevel(state.level + 1);
        state.hp++;
      }
    }, 2200);
  }
}

export function boom(p: Vec2) {
  playBoom();
  if (particles.length < 20) particles.push(...makeExplosion(p));
}

function booms(p: Vec2, n) {
  for (let i = 0; i < n; ++i) {
    setTimeout(() => boom([p[0] + r11(), p[1] + r11()]), i * 300);
  }
}

export { shipParticles };

function move({ pos, vec }: { pos: Vec2; vec: Vec2 }, dt: number) {
  pos[0] += vec[0] * dt;
  pos[1] += vec[1] * dt;
  wraparound(pos);
}

function wraparound(p: Vec2) {
  // wraparound with a little deadzone for simplicity
  // idea: different deadzone for different objects
  if (p[0] > 17) p[0] -= 34;
  if (p[0] < -17) p[0] += 34;
  if (p[1] > 10) p[1] -= 20;
  if (p[1] < -10) p[1] += 20;
}

window.addEventListener("keyup", (e) => {
  if (e.code == "KeyQ" && state.title) {
    setLevel();
  }
  if (e.key == "Escape") {
    titleScreen();
  }
  if (e.code == "KeyR") {
    if ((state.win && state.level == 5) || (!state.title && state.hp == 0)) {
      titleScreen();
      setLevel();
    }
  }
});

window.addEventListener("dblclick", (e) => {
  if (state.win && state.level == 5) {
    const text = `I just beat ALL the rocks and scored ${
      state.score * 10
    } in Beat Rocks! #js13k @beat_rocks_game`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
    );
  } else if (!state.title && state.hp == 0) {
    const text = `I just reached level ${state.level + 1} and scored ${
      state.score * 10
    } in Beat Rocks! #js13k @beat_rocks_game`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
    );
  }
});

// @ts-ignore
window.state = state;
export { state, step };
