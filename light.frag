precision mediump float;

#define LN 4

varying vec2 VPos;
uniform vec2 Lights[LN];
uniform vec3 LightColors[LN];

float sq(float x) {return x*x;}

void main() {
    vec3 color = vec3(0., 0., 0.);

    // vec2 lightPos = lights[0];
    vec2 lightPos = Lights[0];
    vec2 adjustedLightPos = lightPos/vec2(16.,9.);
    vec3 light = vec3(1.,0.,0.);
    float dist2 = sq(adjustedLightPos[0]-VPos[0]) + sq((adjustedLightPos[1]-VPos[1])*9./16.);
    color += light*(1.0-dist2*2.0)*0.05;

    gl_FragColor = vec4(
        color,
        1.
    );
}
