import initRegl, { Vec2, Vec3 } from "regl";

const regl = initRegl(document.getElementById("C"));
export default regl;
// @ts-ignore
import vert from "./vert.glsl";
// @ts-ignore
import frag from "./frag.glsl";

export { vert, frag };
