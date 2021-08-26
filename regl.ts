import initRegl, { Vec2, Vec3 } from "regl";

const regl = initRegl(document.getElementById("C"));
export default regl;
// @ts-ignore
import vert from "./shader.vert";
// @ts-ignore
import frag from "./shader.frag";

export { vert, frag };
