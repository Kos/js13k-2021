precision mediump float;

varying float VBar;
varying vec3 VColor;
varying float VLife;

uniform float LifeMax;

void main() {
    // Left and right edges
    float r1 = max(0., VBar);
    float r2 = -min(0., VBar);

    // Distance from center
    float r3 = abs(VBar);
    r3 *= r3;
    r3 = 1.0-r3;

    float f = pow(
        pow(sin(gl_FragCoord.y), 2.0),
        0.4);
    vec3 color = VColor * (VLife/LifeMax) * f;

    gl_FragColor = vec4(color, 1);
}
