precision mediump float;

attribute vec3 Position;
attribute vec3 Normal;
attribute float Side;
attribute float Life;

uniform vec2 Translation;
uniform float Rotation;
uniform float RotationY;
uniform float RotationZ;
uniform float Thickness;
uniform float Scale;
uniform vec3 Color;

varying float VBar;
varying vec3 VColor;
varying float VLife;
varying float VBar2;
varying vec2 VPos;

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
    float Aspect = 16./9.;
    
    // MODEL SPACE

    // Rotate and scale the model
    vec3 pos = Position;
    vec3 norm = Normal;

    pos *= Scale;

    vec3 rotationAxis = vec3(1.0, 1.0, 0.2);
    pos = rotate(pos, rotationAxis, Rotation);
    norm = rotate(norm, rotationAxis, Rotation);

    mat3 RY = mat3(
        cos(RotationY),    0,    -sin(RotationY),
        0,                 1,    0,
        sin(RotationY),    0,    cos(RotationY)
    );
    pos = RY*pos;
    norm = RY*norm;

    // Downcast model to 2D
    vec2 pos2d = pos.xy;
    vec2 norm2d = norm.xy;
    vec2 binormal = normalize(vec2(norm2d.y, -norm2d.x));

    // Faux perspective
    // float pseudoDepth = (pos.z*depthMultiplier + 1.0) * 0.5;
    // float depthScaleFactor = pow(2.0, pseudoDepth) *0.5;

    float pseudoDepth = pos.z*7.0;
    float depthScaleFactor = pow(2.0, pseudoDepth);
    pos2d *= depthScaleFactor; // This effect is somewhat fishy

    // Extrude the line
    pos2d = pos2d + binormal * Side * Thickness * depthScaleFactor;

    
    // Rotate again (not entirely clear why I didn't do that in model space)
    mat2 RZ = mat2(cos(RotationZ), -sin(RotationZ), sin(RotationZ), cos(RotationZ));
    pos2d = RZ * pos2d;

    // Scale everything to match screen aspect ratio
    pos2d *= vec2(1, Aspect);

    // Move to right place
    pos2d += Translation * vec2(1./16.0, 1./9.);

    // Output   
    gl_Position = vec4(pos2d, -pos.z, 1);
    VBar = Side;
    VColor = Color;
    VLife = Life;
    VPos=pos2d;
}
