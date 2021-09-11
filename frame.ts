import type { Vec2, Vec3 } from "regl";
import {
  drawAsteroid,
  drawAsteroid2,
  drawAsteroid3,
  drawCircle,
  drawCube,
  drawEye,
  drawEye2,
  drawLeship,
  drawLine,
  drawMine,
} from "./models";
import regl from "./regl";
import { shipParticles, state, step } from "./state";
import { particles } from "./particles";
import { currentBeatFraction } from "./audio";
import { makeOneOffText, makeTextDrawcall } from "./text";
import { min, pow, sin, TAU, lerp, max } from "./math";

let prevTime = null;

const texts = [
  "beat", // 0
  "rocks",
  "press Q to start",
  "mind the rhythm",
  "level 1/6\nwarm up the engines", // 4
  "level 2/6\naura sense",
  "level 3/6\nmy house is full of traps",
  "level 4/6\nmagicland dizzy",
  "level 5/6\nminefield mahjong",
  "level 6/6\nseason finale",
  "well done", // 10
  "excellent",
  "astounding",
  "astoneding", // sic
  "q", // 14
  "w",
  "e",
  "beat\nmiss", // 17
  "POW", // 18
  "  Aura\nunlocked\n / W /", // 19
  " Mortar\nunlocked\n / E /",
  " Cannon\namplified",
  "  Aura\nempowered",
].map(makeTextDrawcall);

regl.frame((context) => {
  const cbf = currentBeatFraction();
  const dt = context.time - (prevTime || context.time);
  prevTime = context.time;

  step(dt);
  particles.map((system) => system.update(dt));
  particles.splice(0, particles.length, ...particles.filter((x) => x.alive));

  regl.clear({
    color: [0, 0, 0, 1],
  });

  const levelColors: [Vec3, Vec3][] = [
    [
      [0, 0, 1],
      [0, 1, 0],
    ],
    [
      [0, 0, 1],
      [1, 0, 1],
    ],
    [
      [0.5, 0.5, 0],
      [1, 0.5, 0],
    ],
    [
      [0.2, 0.2, 1],
      [1, 0.2, 0],
    ],
    [
      [1, 0.3, 0],
      [0.5, 0, 0],
    ],
    [
      [1, 0, 1],
      [0, 1, 0],
    ],
  ];

  const l = state.title ? 4 : state.level;
  const lights: Vec2[] = [
    [-6, ((l * 69) % 16) - 8],
    [6, ((l * 32) % 16) - 8],
  ];
  const lightColors = [...levelColors[l]];
  if (!state.title) {
    lights.push(state.ship.pos);
    lightColors.push([0.2, 0.2, 1]);
  }
  drawLine({
    translation: [0, -9],
    thickness: 100,
    scale: 1.2,
    lights,
    lightColors,
  });

  state.asteroids.forEach((a) => {
    [drawAsteroid, drawAsteroid2, drawAsteroid3][a.generation]({
      translation: a.pos,
      rotation: a.rotation + state.rotation,
      rotationZ: a.rZ * 6,
      scale: (0.1 * a.colliderSize) / 1.6,
      thickness: 0.2,
      color: a.color,
    });
    state.renderHitboxes &&
      drawCircle({
        translation: a.pos,
        scale: a.colliderSize / 16,
        thickness: 0.4,
        color: a.collides ? [1, 0, 0] : [0.2, 0.2, 0.2],
      });
  });

  state.mines.forEach((e) => {
    drawMine({
      translation: e.pos,
      scale: 0.05,
      thickness: 0.2,
      rotationY: state.rotation * 2 + pow(2, 1.2 - min(e.life, 1.2) + 1) * 4,
      color: [0.3, 0, 0],
    });
    (e.life > 1.2 ? drawEye2 : drawEye)({
      translation: e.pos,
      scale: 0.008,
      thickness: 0.2,
      color: [1, 0, 0],
    });
    drawCircle({
      translation: e.pos,
      scale: e.colliderSize / 16,
      thickness: 0.2,
      color: [0.3, 0, 0],
    });
  });
  state.aliens.forEach((e) => {
    drawCube({
      translation: e.pos,
      rotation: -state.rotation,
      rotationY: -state.rotation * 2,

      scale: 0.1,
      thickness: 0.2,
      color: [1, 1, 1],
    });
    drawCube({
      translation: e.pos,
      rotation: -state.rotation * 2,
      rotationY: -state.rotation,
      scale: 0.1,
      thickness: 0.2,
      color: [1, 1, 1],
    });
    (currentBeatFraction() > 0.2 ? drawEye : drawEye2)({
      translation: e.pos,
      scale: 0.01,
      thickness: 0.2,
      color: [1, 1, 1],
    });
    const sc = e.shootCooldown;
    if (sc > 0.6) {
      // warmup
      drawLine({
        translation: e.pos,
        rotationZ: e.shootAngle,
        scale: 2.5,
        thickness: 0.1,
        color: [1, 1, 1],
      });
    } else if (sc) {
      //actual shoot

      // shadow, widening
      drawLine({
        translation: e.pos,
        rotationZ: e.shootAngle,
        scale: 2.5,
        thickness: (1 - sc) * 2,
        color: [sc, sc, sc],
      });
      // shoot, narrowing
      drawLine({
        translation: e.pos,
        rotationZ: e.shootAngle,
        scale: 2.5,
        thickness: sc * 2,
        color: [sc * 2, sc * 1, sc * 2],
      });
    }
  });

  [...state.bullets, ...state.mortars].forEach((b) => {
    drawLine({
      translation: b.pos,
      rotationZ: b.rotation,
      scale: 0.05,
      thickness: 0.3,
      color: [1, 0, 0],
    });
  });
  state.enemyBullets.forEach((b) => {
    drawLine({
      translation: b.pos,
      rotationZ: b.rotation,
      scale: 0.05,
      thickness: 0.3,
      color: [1, 1, 0],
    });
  });

  if (state.title) {
    function easeOutElastic(x: number): number {
      const c4 = TAU / 3;

      return x === 0
        ? 0
        : x === 1
        ? 1
        : pow(2, -10 * x) * sin((x * 10 - 0.75) * c4) + 1;
    }
    const rotationY = (easeOutElastic(cbf) - 1) * 0.1;
    texts[0]({
      translation: [0, 4],
      scale: 0.02,
      color: [1, 1, 1],
      thickness: lerp(0.9, 0.3, cbf),
      rotationY,
    });
    texts[1]({
      translation: [0, 0],
      scale: 0.02,
      color: [1, 1, 1],
      thickness: lerp(0.9, 0.3, cbf),
      rotationY,
    });
    texts[2]({
      translation: [0, -6],
      scale: 0.008,
      color: [0.5, 0.5, 0.5],
      thickness: 0.3,
    });
    texts[3]({
      translation: [0, -8],
      scale: 0.008,
      color: [0.5, 0.5, 0.5],
      thickness: 0.3,
    });
  } else {
    state.hp &&
      drawLeship({
        translation: state.ship.pos,
        rotation: state.ship.hitTimer
          ? pow(state.ship.hitTimer / 1.2, 3) * 7
          : 0,
        rotationY: state.ship.thrust,
        rotationZ: state.ship.angle,
        scale: 0.05,
        thickness: lerp(0.6, 0.1, cbf),
        color: [0.2, 0.2, 1],
      });
    state.renderHitboxes &&
      drawCircle({
        translation: state.ship.pos,
        scale: state.ship.colliderSize / 16,
        thickness: 0.4,
        color: state.ship.collides ? [1, 0, 0] : [0.2, 0.2, 0.2],
      });
    if (state.ship.aura) {
      const { pos, aura } = state.ship;
      const { auraSize: aus } = state;
      const auraThickness = 3 * (0.6 - aura);
      drawCircle({
        translation: pos,
        scale: (aura * aus) / 16,
        thickness: auraThickness,
        color: [1, 0, 1],
      });
      [0.8, 0.9, 1.1, 1.3].forEach((x) => {
        drawCircle({
          translation: pos,
          scale: (x * (aura * aus)) / 16,
          thickness: auraThickness * 0.5,
          color: [0.4 * x, 0, 0.4 / x],
        });
      });
    }
  }

  state.blasts.map(({ pos, size: aura }) => {
    const aus = 3;
    const auraThickness = 3 * (0.6 - aura);
    drawCircle({
      translation: pos,
      scale: (aura * aus) / 16,
      thickness: auraThickness,
      color: [1, 0, 1],
    });
    [0.8, 0.9, 1.1, 1.3].forEach((x) => {
      drawCircle({
        translation: pos,
        scale: (x * (aura * aus)) / 16,
        thickness: auraThickness * 0.5,
        color: [0.4 * x, 0.4 / x, 1],
      });
    });
  });

  state.powerups.map(({ pos }) => {
    const color: [number, number, number] = [0, 1, 0];
    drawCube({
      translation: pos,
      rotation: state.rotation * 3,
      rotationY: state.rotation * 0.02,
      scale: 0.08,
      thickness: 0.3,
      color,
    });
    drawCircle({
      translation: pos,
      scale: 1 / 16,
      thickness: 0.3,
      color,
    });
    texts[18]({
      translation: [pos[0], pos[1] - 0.3],
      scale: 0.004,
      thickness: 0.3,
      color,
    });
  });

  particles.forEach((p) => {
    p.render();
  });
  shipParticles && shipParticles.render();

  state.signs.forEach((s) => {
    const { v = 1 } = s;
    const a = max(0, -s.life + 1);
    const f = pow(a, 3) * 30;
    texts[s.index]({
      translation: s.pos,
      color: s.color || [1 - a, 1 - a, 1 - a],
      scale: s.size || 0.004,
      thickness: 0.2,
      rotation: f * v,
    });
  });

  // hud
  if (!state.title) {
    [-1, 0, 1].forEach((x, i) => {
      const locked = state.ship.powerups < i;
      const hot = !locked && (state.cooldowns[i] > 0 ? 0 : 1);
      const color: [number, number, number] = locked
        ? [0.03, 0.03, 0.03]
        : hot
        ? [0.7, 0.7, 0.7]
        : [0.3, 0.3, 0.3];
      drawCube({
        translation: [x * 2, -7.4],
        rotation: -0.2,
        rotationY: -0.15,
        rotationZ: 0.04,
        scale: 0.08,
        thickness: 0.2,
        color,
      });
      texts[15 + x]({
        translation: [x * 2, -7.7],
        scale: lerp(0.005, 0.0055, pow(1 - cbf, 2) * hot),
        thickness: 0.2,
        color,
      });
      if (state.cooldowns[i] > 0) {
        const beats = Math.ceil((state.cooldowns[i] + 0.2) / 0.6);
        makeOneOffText("" + beats)({
          translation: [x * 2, -8.5],
          scale: 0.002,
          thickness: 0.2,
          color: [1, 1, 1],
        });
      }
    });
    drawLeship({
      translation: [-15, -8],
      scale: 0.03,
      thickness: 0.2,
      rotationY: 0.2,
      rotationZ: 0.2,
      color: [0.2, 0.2, 1],
    });
    makeOneOffText(`x${state.hp}`)({
      translation: [-14, -8],
      scale: 0.005,
      thickness: 0.2,
      color: [1, 1, 1],
    });
    makeOneOffText("" + state.score * 10)({
      translation: [12, -8],
      scale: 0.005,
      thickness: 0.2,
      color: [1, 1, 1],
    });
    makeOneOffText("streak " + state.combo)({
      translation: [12, -8.6],
      scale: 0.002,
      thickness: 0.15,
      color: [1, 1, 1],
    });
  }

  if (state.win && state.level == 5) {
    makeOneOffText(
      "Congratulations!\n\nFinal score\n" +
        state.score * 10 +
        "\n\nDouble click to tweet and share"
    )({
      translation: [0, 4],
      scale: 0.008,
      thickness: 0.2,
      color: [1, 1, 1],
    });
  }
  if (!state.title && state.hp == 0) {
    makeOneOffText(
      "Game over!\n\nFinal score\n" +
        state.score * 10 +
        "\n\nDouble click to tweet and share\nR to start over"
    )({
      translation: [0, 4],
      scale: 0.008,
      thickness: 0.2,
      color: [1, 1, 1],
    });
  }
});
