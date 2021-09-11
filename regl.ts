// import initRegl from "regl";
// const regl = initRegl(gl);
// export default regl;

import type { Vec2, Vec3, Vec4 } from "regl";

const canvas = document.getElementById("C") as HTMLCanvasElement;
export const gl = canvas.getContext("webgl");

// TMP
// import initRegl from "regl";
// const oldRegl = initRegl(gl);
// END TMP

// @ts-ignore
import vert from "./shader.vert";
// @ts-ignore
import frag from "./shader.frag";
// @ts-ignore
import lightFrag from "./light.frag";
export { vert, frag, lightFrag };

const vs = gl.createShader(gl.VERTEX_SHADER);
const fs = gl.createShader(gl.FRAGMENT_SHADER);
const ls = gl.createShader(gl.FRAGMENT_SHADER);
const vprog = gl.createProgram();
const lprog = gl.createProgram();
gl.shaderSource(vs, vert);
gl.shaderSource(fs, frag);
gl.shaderSource(ls, lightFrag);
gl.compileShader(vs);
gl.compileShader(fs);
gl.compileShader(ls);
gl.attachShader(vprog, vs);
gl.attachShader(vprog, fs);
gl.attachShader(lprog, vs);
gl.attachShader(lprog, ls);
gl.linkProgram(vprog);
gl.linkProgram(lprog);

// TMP just validate shader
// oldRegl({
//   vert,
//   frag: lightFrag,
// });

const positionLoc = gl.getAttribLocation(vprog, "Position");
const normalLoc = gl.getAttribLocation(vprog, "Normal");
const sideLoc = gl.getAttribLocation(vprog, "Side");
const lifeLoc = gl.getAttribLocation(vprog, "Life");

function bufferFromSize(n: number) {
  const b = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, n, gl.STREAM_DRAW);
  return b;
}

function bufferFromData(data: number[]) {
  const b = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
  return b;
}

function buffer(data) {
  let buf: WebGLBuffer;
  if (Array.isArray(data)) {
    buf = bufferFromData(data);
  } else if (data.data) {
    buf = bufferFromData(data.data);
  } else {
    buf = bufferFromSize(data.length);
  }
  return {
    buf,
    subdata(data: number[]) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferSubData(
        gl.ARRAY_BUFFER,
        0,
        new Float32Array(data.flatMap((x) => x))
      );
    },
  };
}

type TBuffer = ReturnType<typeof buffer>;

function elements(data: number[]) {
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Int16Array(data.flatMap((x) => x)),
    gl.STATIC_DRAW
  );
  return {
    buffer: buf,
    length: data.length,
    subdata(data: number[][]) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf);
      gl.bufferSubData(
        gl.ELEMENT_ARRAY_BUFFER,
        0,
        new Int16Array(data.flatMap((x) => x))
      );
    },
  };
}

let previousTime = null;
function frame(cb) {
  function handler(currentTime) {
    const delta = currentTime - (previousTime || currentTime);
    previousTime = currentTime;
    const context = {
      time: currentTime / 1000,
    };
    cb(context);
    window.requestAnimationFrame(handler);
  }
  window.requestAnimationFrame(handler);
}

function clear({ color }: { color: Vec4 }) {
  gl.clearColor(...color);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

type TElementBuffer = ReturnType<typeof elements>;

const LIGHTS = 4;
const lightbuf = new Float32Array(2 * LIGHTS);
const lightcolbuf = new Float32Array(3 * LIGHTS);

export type Uniforms = {
  Translation: Vec2;
  Rotation: number;
  RotationY: number;
  RotationZ: number;
  Thickness: number;
  Scale: number;
  Color: Vec3;
  LifeMax: number;
};

function myRegl<TU, TA, TP>({
  attributes,
  uniforms,
  elements,
  count,
}: {
  vert?: any;
  frag?: any;
  depth?: any;
  primitive: "triangles";
  attributes: {
    Position: TBuffer;
    Normal: TBuffer;
    Side: TBuffer;
    Life: TBuffer | { constant: [1] };
  };
  elements: TElementBuffer;
  count?: (a: 0, props: any) => number;
  uniforms: {
    Rotation: (a: 0, props: any) => number;
    RotationY: (a: 0, props: any) => number;
    RotationZ: (a: 0, props: any) => number;
    Translation: (a: 0, props: any) => Vec3;
    Thickness: (a: 0, props: any) => number;
    Scale: (a: 0, props: any) => number;
    Color: (a: 0, props: any) => Vec3;
    LifeMax: (a: 0, props: any) => number;
  };
}) {
  return (props) => {
    let prog = props.lights ? lprog : vprog;
    gl.useProgram(prog);
    gl.enableVertexAttribArray(positionLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, attributes.Position.buf);
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(normalLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, attributes.Normal.buf);
    gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(sideLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, attributes.Side.buf);
    gl.vertexAttribPointer(sideLoc, 1, gl.FLOAT, false, 0, 0);

    if ("constant" in attributes.Life) {
      gl.disableVertexAttribArray(lifeLoc);
      gl.vertexAttrib4f(lifeLoc, 1, 0, 0, 0);
    } else {
      gl.bindBuffer(gl.ARRAY_BUFFER, attributes.Life.buf);
      gl.vertexAttribPointer(lifeLoc, 1, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(lifeLoc);
    }

    gl.uniform1f(
      gl.getUniformLocation(prog, "Rotation"),
      uniforms.Rotation(0, props)
    );
    gl.uniform1f(
      gl.getUniformLocation(prog, "RotationY"),
      uniforms.RotationY(0, props)
    );
    gl.uniform1f(
      gl.getUniformLocation(prog, "RotationZ"),
      uniforms.RotationZ(0, props)
    );
    gl.uniform2fv(
      gl.getUniformLocation(prog, "Translation"),
      uniforms.Translation(0, props)
    );
    gl.uniform1f(
      gl.getUniformLocation(prog, "Thickness"),
      uniforms.Thickness(0, props)
    );
    gl.uniform1f(
      gl.getUniformLocation(prog, "Scale"),
      uniforms.Scale(0, props)
    );
    gl.uniform3fv(
      gl.getUniformLocation(prog, "Color"),
      uniforms.Color(0, props)
    );
    gl.uniform1f(
      gl.getUniformLocation(prog, "LifeMax"),
      uniforms.LifeMax(0, props)
    );
    if (props.lights) {
      lightbuf.set(props.lights.flat());
      gl.uniform2fv(gl.getUniformLocation(prog, "Lights"), lightbuf);
      lightcolbuf.fill(0);
      lightcolbuf.set(props.lightColors.flat());
      gl.uniform3fv(gl.getUniformLocation(prog, "LightColors"), lightcolbuf);
    }

    gl.disable(gl.DEPTH_TEST);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elements.buffer);
    gl.drawElements(
      gl.TRIANGLES,
      count ? count(0, props) : elements.length,
      gl.UNSIGNED_SHORT,
      0
    );
    gl.enableVertexAttribArray(lifeLoc);
  };
}

myRegl.buffer = buffer;
myRegl.elements = elements;
myRegl.frame = frame;
myRegl.clear = clear;
export default myRegl;
