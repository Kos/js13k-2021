// Hacks - remove later

import { playBGM } from "./audio";
import { makeExplosion, particles } from "./particles";
import { newAsteroid, state, titleScreen } from "./state";

window.addEventListener("keypress", (e) => {
  if (e.key === "a") {
    newAsteroid();
  }
  if (e.key === "A") {
    state.asteroids = [];
  }
  if (e.key === "P") {
    particles.push(...makeExplosion([-3, 4]));
  }
  if (e.key === "T") {
    titleScreen();
  }
});

if (state.asteroids.length === 0) {
  newAsteroid();
}
