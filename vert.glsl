attribute vec3 Position;
attribute vec3 Normal;
attribute float Side;

uniform float Time;
uniform float Aspect;
uniform vec2 Translation;
uniform float Thickness;
uniform float Scale;

varying lowp float Bar;

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
    float depthMultiplier = 6.0;

    // Rotate and scale the model
    vec3 pos = Position;
    vec3 norm = Normal;

    pos *= Scale;

    vec3 rotationAxis = vec3(1.0, 1.0, 0.2);
    pos = rotate(pos, rotationAxis, Time);
    norm = rotate(norm, rotationAxis, Time);

    // Downcast model to 2D
    vec2 pos2d = pos.xy;
    vec2 norm2d = norm.xy;
    vec2 binormal = normalize(vec2(norm2d.y, -norm2d.x));

    // Faux perspective
    float pseudoDepth = (pos.z*depthMultiplier + 1.0) * 0.5;
    float depthScaleFactor = pow(2.0, pseudoDepth) *0.5;
    pos2d *= depthScaleFactor; // This effect is somewhat fishy

    // Extrude the line
    pos2d = pos2d + binormal * Side * Thickness * depthScaleFactor;

    // Move to world coordinates
    pos2d += Translation;

    // Scale everything to match screen aspect ratio
    pos2d *= vec2(1, Aspect);

    // Output   
    gl_Position = vec4(pos2d, -pos.z, 1);
    Bar = Side;
}