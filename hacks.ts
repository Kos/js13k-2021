// Hacks - remove later

import { mutators, state } from "./state";

window.addEventListener("keypress", (e) => {
  if (e.key === "a") {
    mutators.newAsteroid();
  }
  if (e.key === "A") {
    state.asteroids = [];
  }
});

if (state.asteroids.length === 0) {
  mutators.newAsteroid();
}
