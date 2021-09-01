type TInput = {
  // using numbers so that I can multiply easily without casts
  left: number;
  right: number;
  thrust: number;
  fire: number;
  skill1: number;
  skill2: number;
  skill3: number;
};

const input: TInput = {
  left: 0,
  right: 0,
  thrust: 0,
  fire: 0,
  skill1: 0,
  skill2: 0,
  skill3: 0,
};

type TInputProp = keyof TInput;
const keymap: Record<string, TInputProp> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "thrust",
  Space: "fire",
  KeyQ: "skill1",
  KeyW: "skill2",
  KeyE: "skill3",
};

window.addEventListener("keydown", ({ code }) => {
  input[keymap[code]] = 1;
});
window.addEventListener("keyup", ({ code }) => {
  input[keymap[code]] = 0;
});

export default input;
