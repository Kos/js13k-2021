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
import lerp from "./lerp";
import { currentBeatFraction } from "./audio";
import { makeTextDrawcall } from "./text";

let prevTime = null;

// const hello = makeTextDrawcall("qwertyuiopasdfghjklzxcvbnm");
const texts = [makeTextDrawcall("beat"), makeTextDrawcall("rocks")];

regl.frame((context) => {
  const dt = context.time - (prevTime || context.time);
  prevTime = context.time;

  step(dt);
  particles.map((system) => system.update(dt));
  particles.splice(0, particles.length, ...particles.filter((x) => x.alive));

  regl.clear({
    color: [0, 0, 0, 1],
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
      rotationY:
        state.rotation * 2 + Math.pow(2, 1.2 - Math.min(e.life, 1.2) + 1) * 4,
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

  state.bullets.forEach((b) => {
    drawLine({
      translation: b.pos,
      rotationZ: b.rotation,
      scale: 0.05,
      thickness: 0.3,
      color: [1, 0, 0],
    });
  });

  if (state.title) {
    function easeOutElastic(x: number): number {
      const { pow, sin, PI } = Math;
      const c4 = (2 * PI) / 3;

      return x === 0
        ? 0
        : x === 1
        ? 1
        : pow(2, -10 * x) * sin((x * 10 - 0.75) * c4) + 1;
    }
    const rotationY = (easeOutElastic(currentBeatFraction()) - 1) * 0.1;
    texts[0]({
      translation: [0, 4],
      scale: 0.02,
      color: [1, 1, 1],
      thickness: lerp(0.9, 0.3, currentBeatFraction()),
      rotationY,
    });
    texts[1]({
      translation: [0, 0],
      scale: 0.02,
      color: [1, 1, 1],
      thickness: lerp(0.9, 0.3, currentBeatFraction()),
      rotationY,
    });
  } else {
    drawLeship({
      translation: state.ship.pos,
      rotation: state.ship.hitTimer
        ? Math.pow(state.ship.hitTimer / 1.2, 3) * 7
        : 0,
      rotationY: state.ship.thrust,
      rotationZ: state.ship.angle,
      scale: 0.05,
      // thickness: lerp(0.4, 0.2, (Date.now() % 600) / 600),
      thickness: lerp(0.5, 0.1, currentBeatFraction()),
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
      const auraThickness = 3 * (0.6 - state.ship.aura);
      drawCircle({
        translation: state.ship.pos,
        scale: (state.ship.aura * state.auraSize) / 16,
        thickness: auraThickness,
        color: [1, 0, 1],
      });
      [0.8, 0.9, 1.1, 1.3].forEach((x) => {
        drawCircle({
          translation: state.ship.pos,
          scale: (x * (state.ship.aura * state.auraSize)) / 16,
          thickness: auraThickness * 0.5,
          color: [0.4 * x, 0, 0.4 / x],
        });
      });
    }
  }

  // Poor man's coordinate system
  // const cubes: Vec2[] = [
  //   [-16, -9],
  //   [-8, -9],
  //   [0, -9],
  //   [8, -9],
  //   [16, -9],
  //   [-16, 0],
  //   [-8, 0],
  //   [0, 0],
  //   [8, 0],
  //   [16, 0],
  //   [-16, 9],
  //   [-8, 9],
  //   [0, 9],
  //   [8, 9],
  //   [16, 9],
  // ];
  // cubes.forEach((transform) =>
  //   drawCube({
  //     translation: transform,
  //     rotation: state.rotation,
  //     scale: 0.05,
  //     thickness: 0.2,
  //   })
  // );

  particles.forEach((p) => {
    p.render();
  });
  shipParticles && shipParticles.render();

  if (!state.title)
    [-1, 0, 1].forEach((x, i) => {
      drawCube({
        translation: [x * 2, -8],
        scale: 0.08,
        thickness: 0.2,
        color: state.cooldowns[i] > 0 ? [0.1, 0.1, 0.1] : [0.7, 0.7, 0.7],
      });
    });
});
