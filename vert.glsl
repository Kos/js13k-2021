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

mat4 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}

vec3 rotate(vec3 v, vec3 axis, float angle) {
	mat4 m = rotationMatrix(axis, angle);
	return (m * vec4(v, 1.0)).xyz;
}

void main() {
    float scale = 0.0005;

    // Rotate and scale the model
    vec3 pos = Position;
    vec3 sis = SisterPosition;

    pos *= scale;
    sis *= scale;

    vec3 rotationAxis = vec3(1.0, 1.0, 0.2);
    pos = rotate(pos, rotationAxis, Time);
    sis = rotate(sis, rotationAxis, Time);
    // pos.xy = rotate(pos.xy, Time);
    // sis.xy = rotate(sis.xy, Time);


    // Downcast model to 2D
    vec2 pos2d = pos.xy;
    vec2 sis2d = sis.xy;

    // Extrude the line
    vec2 lineForward = normalize(sis2d - pos2d);
    vec2 lineNormal = vec2(lineForward.y, -lineForward.x);
    pos2d = pos2d + lineNormal * Thickness * Side * (pos.z+1.0);


    // Move to world place
    pos2d += Translation;

    // Scale everything to match screen aspect ratio
    pos2d *= vec2(1, Aspect);

    // Output   
    gl_Position = vec4(pos2d, 0, 1);
}