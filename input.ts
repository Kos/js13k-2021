type TInput = {
  // using numbers so that I can multiply easily without casts
  left: number;
  right: number;
  thrust: number;
  skill1: number;
  skill2: number;
  skill3: number;
};

const input: TInput = {
  left: 0,
  right: 0,
  thrust: 0,
  skill1: 0,
  skill2: 0,
  skill3: 0,
};

type TInputProp = keyof TInput;
const keymap: Record<string, TInputProp> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "thrust",
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

// window.addEventListener("touchstart", (e) => {
//   e.preventDefault();
//   input.skill1 = 1;
// });
// window.addEventListener("touchmove", (e) => {
//   e.preventDefault();
//   input.skill1 = 0;

//   for (let i = 0; i < e.touches.length; ++i) {
//     const t = e.touches[i];
//     const lq = window.innerWidth / 4,
//       rq = window.innerWidth - lq,
//       h = 1 - t.clientY / window.innerHeight;

//     if (t.clientX < lq) {
//       // left
//       input.left = 1 - h;
//       input.right = 0;
//       input.thrust = h;
//     }
//     if (t.clientX > rq) {
//       input.right = 1 - h;
//       input.left = 0;
//       input.thrust = h;
//     }
//   }
// });
// window.addEventListener("touchend", (e) => {
//   input.left = input.right = input.thrust = input.skill1 = 0;
// });

export default input;
