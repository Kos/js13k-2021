// particle system?

import type { Vec2, Vec3 } from "regl";
import { cos, r11, sin } from "./math";
import regl, { vert, frag } from "./regl";
export type TParticleEffect = {
  // How particles should be emitted and updated
  pos: Vec2;
  vec: Vec2;
  variance: number;
  angularVariance: number;
  rate: number | "instant";
  alive: boolean;
  emit: () => void;
  update: (dt: number) => void;
  render: () => void;
};

type TParticleSettings = {
  len: number;
  thickness: number;
  life: number;
  color: [number, number, number];
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
  aliveParticles: number;
  translation: Vec2;
  rotation: number;
  thickness: number;
  scale: number;
  color: Vec3;
};

type TParticleState = {
  life: number;
  pos: Vec3;
  vec: Vec3;
  angle: number;
  angular: number;
  cos: number;
  sin: number;
};

function makeEffect(
  particleCount: number,
  settings: TParticleSettings
): TParticleEffect {
  // unlike models, geometry for particles need to be dynamic since we're going to draw whole system in one go ...

  // Init state
  const particles: TParticleState[] = Array(particleCount)
    .fill(0)
    .map(() => ({
      // TODO can be 2d
      life: 0,
      pos: [0, 0, 0],
      vec: [0, 0, 0],
      angle: 0,
      cos: 1,
      sin: 0,
      angular: 0,
    }));
  const vertexCount = particleCount * 4; // one quad (two triangles) per particle
  const vertexSizeInBytes = 3 * 4; // 3 floats 4 byte each

  // Allocate buffers
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
      data: particles.flatMap(() => [-1, 1, -1, 1]),
    }),
    life: regl.buffer({
      type: "float",
      length: vertexCount * 4,
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
      Life: buffers.life,
    },
    elements: buffers.elements,
    count: (context, props) => props.aliveParticles * 6,
    uniforms: {
      Rotation: () => 0,
      RotationY: () => 0,
      RotationZ: () => 0,
      Translation: (context, props) => props.translation || [0, 0],
      Thickness: (context, props) => settings.thickness,
      Scale: () => 1,
      Color: () => settings.color,
      LifeMax: () => settings.life,
    },
    depth: {
      enable: false,
    },
  });

  let nextIndex = 0;
  let mana = 0;

  return {
    alive: true,
    pos: [0, 0],
    vec: [0, 0],
    variance: 2,
    angularVariance: 5,

    rate: 0,

    emit() {
      const newParticle: TParticleState = {
        life: settings.life,
        pos: [this.pos[0], this.pos[1], 0],
        vec: [
          this.vec[0] + this.variance * r11(),
          this.vec[1] + this.variance * r11(),
          0,
        ],

        angle: 0, // tbd
        cos: 1,
        sin: 0,
        angular: this.angularVariance * r11(),
      };
      newParticle.angle = Math.atan2(newParticle.vec[1], newParticle.vec[0]);
      const index = nextIndex++;
      nextIndex %= particleCount;
      particles[index] = newParticle;
    },

    update(dt: number) {
      particles.forEach((p) => {
        p.life -= dt;
        p.angle += p.angular * dt;
        p.pos[0] += p.vec[0] * dt;
        p.pos[1] += p.vec[1] * dt;
        p.pos[2] += p.vec[2] * dt;
        p.cos = cos(p.angle);
        p.sin = sin(p.angle);
      });

      if (this.rate === "instant") {
        this.rate = "expired";
        for (let i = 0; i < particleCount; ++i) {
          this.emit();
        }
      } else if (this.rate > 0) {
        mana += dt;
        while (mana >= this.rate) {
          mana -= this.rate;
          this.emit();
        }
      }

      if (
        this.alive &&
        this.rate === "expired" &&
        !particles.some((x) => x.life > 0)
      ) {
        this.alive = false;
      }
    },

    render() {
      const { len = 0.005 } = settings;
      // const {len} = this.
      // const len = 0.06; // square particle
      const alive = particles.filter((a) => a.life > 0);

      buffers.position.subdata(
        alive
          .flatMap(({ pos, cos, sin }) => {
            const pos1 = [
              pos[0] / 16 - len * cos,
              pos[1] / 16 - len * sin,
              pos[2],
            ];
            const pos2 = [
              pos[0] / 16 + len * cos,
              pos[1] / 16 + len * sin,
              pos[2],
            ];
            return [pos1, pos1, pos2, pos2];
          })
          .flat()
      );
      buffers.normal.subdata(
        alive
          .flatMap(({ cos, sin }) => {
            return [
              [cos, sin, 0],
              [cos, sin, 0],
              [cos, sin, 0],
              [cos, sin, 0],
            ];
          })
          .flat()
      );
      buffers.life.subdata(
        alive.flatMap((p) => [p.life, p.life, p.life, p.life])
      );

      drawcall({
        aliveParticles: alive.length,
      });
    },
  };
}

export function makeExhaust(): TParticleEffect {
  const count = 15;
  const effect = makeEffect(count, {
    len: 0.01,
    thickness: 0.01,
    life: 0.7,
    color: [0.5, 0.5, 0.8],
  });

  return {
    ...effect,
    rate: 1.2,
  };
}

export function makeExplosion(pos: Vec2): TParticleEffect[] {
  const count = 20;
  return [
    // Comic lines
    {
      ...makeEffect(3, {
        len: 0.1,
        thickness: 0.002,
        life: 0.3,
        color: [1, 1, 1],
      }),
      pos,
      rate: "instant",
      variance: 0.001,
      angularVariance: 0,
    },
    // Chaff
    {
      ...makeEffect(60, {
        len: 0.005,
        thickness: 0.005,
        life: 1.2,
        color: [0.2, 0.2, 0.2],
      }),
      pos,
      rate: "instant",
      variance: 3,
    },
    // Fire
    {
      ...makeEffect(20, {
        len: 0.005,
        thickness: 0.003,
        life: 0.5,
        color: [0.7, 0.4, 0.2],
      }),
      pos,
      rate: "instant",
      variance: 5,
    },
    {
      ...makeEffect(20, {
        len: 0.005,
        thickness: 0.003,
        life: 0.5,
        color: [0.7, 0.7, 0.2],
      }),
      pos,
      rate: "instant",
      variance: 5,
    },
    // Sparks
    {
      ...makeEffect(6, {
        len: 0.07,
        thickness: 0.003,
        life: 0.15,
        color: [0.7, 0.7, 0],
      }),
      pos,
      rate: "instant",
      variance: 20,
      angularVariance: 0,
    },
    // Maybe also a circular shockwave or ..?
  ];
}

export { particles };
