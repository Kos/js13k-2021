type TInput = {
  // using numbers so that I can multiply easily without casts
  left: number;
  right: number;
  thrust: number;
  fire: number;
};

const input: TInput = {
  left: 0,
  right: 0,
  thrust: 0,
  fire: 0,
};

type TInputProp = keyof TInput;
const keymap: Record<string, TInputProp> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "thrust",
};

window.addEventListener("keydown", ({ code }) => {
  input[keymap[code]] = 1;
});
window.addEventListener("keyup", ({ code }) => {
  input[keymap[code]] = 0;
});

export default input;
