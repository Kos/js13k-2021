import { Vec2 } from "regl";
import { drawAsteroid, drawCube } from "./models";
import regl from "./regl";
import { state, step } from "./state";
import { particles } from "./particles";

let prevTime = null;

regl.frame((context) => {
  const dt = context.time - (prevTime || context.time);
  prevTime = context.time;

  step(dt);
  particles.map((system) => system.update(dt));

  regl.clear({
    color: [0, 0, 0, 1],
  });

  state.asteroids.forEach((a) =>
    drawAsteroid({
      translation: a.pos,
      rotation: a.rotation + state.rotation,
      scale: 0.1,
      thickness: 0.2,
      color: a.color,
    })
  );

  const cubes: Vec2[] = [
    [-16, -9],
    [-16, 9],
    [16, -9],
    [16, 9],
    [0, 0],
  ];
  cubes.forEach((transform) =>
    drawCube({
      translation: transform,
      rotation: state.rotation,
      scale: 0.1,
      thickness: 0.2,
    })
  );

  particles.forEach((p) => {
    p.render();
  });
});
