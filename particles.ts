// particle system?

import REGL from "regl";
import regl, { vert, frag } from "./regl";
const { cos, sin } = Math;
type TParticleEffect = {
  settings: TParticleSettings;

  emit: () => void;
  update: (dt: number) => void;
  render: () => void;
};

type TParticleSettings = {
  // How each particle should behave ONCE it's emitted
};

const particles: TParticleEffect[] = [];

/* how it works?
- as a user
- I create a particle effect
- I give the effect some properties (base position, speed?)
- I can move the effect around
- The effect emits particles until it dies, maybe it emits all by once, maybe over time, maybe it never dies
- effects can be owned by objects
- effects can be set on and off (?)
- The system cleans up dead effects over time

Examples:
- Explosion: emit 20 particles in random direction, then nothing
- Thruster: emit 1 particle every .02s in a random direction


There are separate:
- emitter settings
- particle settings

particle settings = uniform values for shader? width, thickness... but also things like speed and rotation

particles should be rendered as lines to keep the theme going, we can roll far with that (and reuse the shader)

*/

type Props = {
  translation: REGL.Vec2;
  rotation: number;
  thickness: number;
  scale: number;
  color: REGL.Vec3;
};

type TParticleState = {
  pos: REGL.Vec3;
  vec: REGL.Vec3;
  angle: number;
  angular: number;
  cos: number;
  sin: number;
};

function makeExplosion(): TParticleEffect {
  /* Generate geometry for the shader */

  // unlike models, geometry for particles need to be dynamic since we're going to draw whole system in one go ...

  const particleCount = 15; // allocation
  const len = 0.06; // square particle
  const particles: TParticleState[] = Array(particleCount)
    .fill(0)
    .map((_, n) => ({
      pos: [n / 10, (n % 4) / 10, 0],
      vec: [0.1, 0, 0],
      angle: 0,
      cos: 1,
      sin: 0,
      angular: (Math.random() - 0.5) * 10,
    }));
  const vertexCount = particleCount * 4; // one quad (two triangles) per particle
  const vertexSizeInBytes = 3 * 4; // 3 floats 4 byte each

  const buffers = {
    position: regl.buffer({
      type: "float",
      length: vertexCount * vertexSizeInBytes,
      usage: "stream",
    }),
    normal: regl.buffer({
      type: "float",
      length: vertexCount * vertexSizeInBytes,
      usage: "stream",
    }),
    side: regl.buffer({
      type: "float",
      data: particles.flatMap((_, n) => [-1, 1, -1, 1]),
    }),
    elements: regl.elements(
      particles.flatMap((_, n) => [
        4 * n,
        4 * n + 1,
        4 * n + 2,
        4 * n + 2,
        4 * n + 1,
        4 * n + 3,
      ])
    ),
  };

  const drawcall = regl<{}, {}, Props>({
    vert,
    frag,
    primitive: "triangles",
    attributes: {
      Position: buffers.position,
      Normal: buffers.normal,
      Side: buffers.side,
    },
    elements: buffers.elements,
    uniforms: {
      Rotation: (context, props) => props.rotation || 0,
      Aspect: (context) => context.viewportWidth / context.viewportHeight,
      Translation: (context, props) => props.translation || [0, 0],
      Thickness: (context, props) => props.thickness * 0.1 || 0.01,
      Scale: (context, props) => props.scale || 0.5,
      Color: (context, props) => props.color || [1, 1, 0],
    },
    depth: {
      enable: false,
    },
  });

  return {
    settings: {},

    emit() {},

    update(dt: number) {
      particles.forEach((p) => {
        p.angle += p.angular * dt;
        p.pos[0] += p.vec[0] * dt;
        p.pos[1] += p.vec[1] * dt;
        p.pos[2] += p.vec[2] * dt;
        p.cos = cos(p.angle);
        p.sin = sin(p.angle);
      });
    },

    render() {
      buffers.position.subdata(
        particles.flatMap(({ pos, cos, sin }) => {
          const pos1 = [pos[0] - len * cos, pos[1] - len * sin, pos[2]];
          const pos2 = [pos[0] + len * cos, pos[1] + len * sin, pos[2]];
          return [pos1, pos1, pos2, pos2];
        })
      );
      buffers.normal.subdata(
        particles.flatMap(({ cos, sin }) => {
          return [
            [cos, sin, 0],
            [cos, sin, 0],
            [cos, sin, 0],
            [cos, sin, 0],
          ];
        })
      );

      drawcall({
        translation: [2, 0],
      });
    },
  };
}

// const explosion = makeExplosion();

particles.push(makeExplosion(), makeExplosion());

setInterval(() => {
  // explosion.emit();
}, 1500);

export { particles };
