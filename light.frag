precision mediump float;

#define LN 4

varying vec2 VPos;
uniform vec2 Lights[LN];
uniform vec3 LightColors[LN];

float sq(float x) {return x*x;}

void main() {
    vec3 color = vec3(0., 0., 0.);

    for (int i=0; i<3;++i) {
        vec2 lightPos = Lights[i];
        vec2 adjustedLightPos = lightPos/vec2(16.,9.);
        vec3 light = LightColors[i];
        float dist2 = sq(adjustedLightPos[0]-VPos[0]) + sq((adjustedLightPos[1]-VPos[1])*9./16.);
        float intensity = clamp(1.0 - dist2, 0.0, 1.0);
        color += light * intensity * 0.1;
    }

    gl_FragColor = vec4(
        color,
        1.
    );
}
