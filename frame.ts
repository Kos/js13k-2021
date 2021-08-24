import { Vec2 } from "regl";
import { drawAsteroid, drawCube, drawLeship } from "./models";
import regl from "./regl";
import { state, step } from "./state";
import { particles } from "./particles";
import { getConfigFileParsingDiagnostics } from "typescript";
import fps from "./fps";

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

  drawLeship({
    translation: state.ship.pos,
    rotationY: state.ship.thrust,
    rotationZ: state.ship.angle,
    scale: 0.1,
    thickness: 0.2,
    color: [0.2, 0.2, 1],
  });

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
