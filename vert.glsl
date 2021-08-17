attribute vec3 Position;
attribute vec3 SisterPosition;
attribute float Side;

uniform float Time;
uniform float Aspect;
uniform vec2 Translation;
uniform float Thickness;

vec2 rotate(vec2 v, float a) {
	float s = sin(a);
	float c = cos(a);
	mat2 m = mat2(c, -s, s, c);
	return m * v;
}

void main() {
    // Downcast model to 2D
    vec2 pos = Position.xy;
    vec2 pos2 = SisterPosition.xy;

    // Extrude the line
    vec2 axis = normalize(pos2-pos);
    vec2 normal = vec2(axis.y, -axis.x);
    pos = pos + normal * Thickness * Side;

    // Scale the model
    pos *= 1.0;

    // Rotate it around its own axis
    pos = rotate(pos, Time);

    // Move to world place
    pos += Translation;

    // Scale everything to match screen aspect ratio
    pos *= vec2(1, Aspect);

    // Output   
    gl_Position = vec4(pos, 0, 1);
}