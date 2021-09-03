// Hacks - remove later

import { source } from "./audio";
import { makeExplosion, particles } from "./particles";
import { mutators, state } from "./state";

window.addEventListener("keypress", (e) => {
  if (e.key === "a") {
    mutators.newAsteroid();
  }
  if (e.key === "A") {
    state.asteroids = [];
  }
  if (e.key === "P") {
    particles.push(...makeExplosion([-3, 4]));
  }
  if (e.key === "M") {
    source.start();
  }
});

if (state.asteroids.length === 0) {
  mutators.newAsteroid();
}
