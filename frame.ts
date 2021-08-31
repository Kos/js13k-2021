import { Vec2 } from "regl";
import {
  drawAsteroid,
  drawCircle,
  drawCube,
  drawLeship,
  drawLine,
} from "./models";
import regl from "./regl";
import { shipParticles, state, step } from "./state";
import { particles } from "./particles";
import lerp from "./lerp";

let prevTime = null;

regl.frame((context) => {
  const dt = context.time - (prevTime || context.time);
  prevTime = context.time;

  step(dt);
  particles.map((system) => system.update(dt));

  regl.clear({
    color: [0, 0, 0, 1],
  });

  state.asteroids.forEach((a) => {
    drawAsteroid({
      translation: a.pos,
      rotation: a.rotation + state.rotation,
      scale: (0.1 * a.colliderSize) / 1.6,
      thickness: 0.2,
      color: a.color,
    });
    drawCircle({
      translation: a.pos,
      scale: a.colliderSize / 16,
      thickness: 0.4,
      color: a.collides ? [1, 0, 0] : [0.2, 0.2, 0.2],
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

  drawLeship({
    translation: state.ship.pos,
    rotationY: state.ship.thrust,
    rotationZ: state.ship.angle,
    scale: 0.05,
    thickness: lerp(0.4, 0.2, (Date.now() % 600) / 600),
    color: [0.2, 0.2, 1],
  });
  drawCircle({
    translation: state.ship.pos,
    scale: state.ship.colliderSize / 16,
    thickness: 0.4,
    color: state.ship.collides ? [1, 0, 0] : [0.2, 0.2, 0.2],
  });

  const cubes: Vec2[] = [
    [-16, -9],
    [-8, -9],
    [0, -9],
    [8, -9],
    [16, -9],
    [-16, 0],
    [-8, 0],
    [0, 0],
    [8, 0],
    [16, 0],
    [-16, 9],
    [-8, 9],
    [0, 9],
    [8, 9],
    [16, 9],
  ];
  cubes.forEach((transform) =>
    drawCube({
      translation: transform,
      rotation: state.rotation,
      scale: 0.05,
      thickness: 0.2,
    })
  );

  particles.forEach((p) => {
    p.render();
  });
  shipParticles.render();
});
