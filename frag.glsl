varying lowp float Bar;
precision mediump float;

void main() {
    // Left and right edges
    float r1 = max(0., Bar);
    float r2 = -min(0., Bar);

    // Distance from center
    float r3 = abs(Bar);
    r3 *= r3;
    r3 = 1.0-r3;



    vec3 color = vec3(r1, r2, 0);

    gl_FragColor = vec4(color, 1);
}