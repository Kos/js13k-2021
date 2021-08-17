attribute vec2 Position;
uniform float Time;
uniform float Aspect;
uniform vec2 Translation;

vec2 rotate(vec2 v, float a) {
	float s = sin(a);
	float c = cos(a);
	mat2 m = mat2(c, -s, s, c);
	return m * v;
}

void main() {
    vec2 pos = Position;
    pos = rotate(pos, Time);
    pos *= 0.1;
    pos += Translation;
    pos *= vec2(1, Aspect);
    
    gl_Position = vec4(pos, 0, 1);
}