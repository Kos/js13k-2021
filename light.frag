precision mediump float;

#define LN 4

varying vec2 VPos;
uniform vec2 Lights[LN];
uniform vec3 LightColors[LN];

float rand(vec2 c){
	return fract(sin(dot(c.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

float noise(vec2 p, float freq ){
	float unit = 10.0/freq;
	vec2 ij = floor(p/unit);
	vec2 xy = mod(p,unit)/unit;
	//xy = 3.*xy*xy-2.*xy*xy*xy;
	xy = .5*(1.-cos(3.14159*xy));
	float a = rand((ij+vec2(0.,0.)));
	float b = rand((ij+vec2(1.,0.)));
	float c = rand((ij+vec2(0.,1.)));
	float d = rand((ij+vec2(1.,1.)));
	float x1 = mix(a, b, xy.x);
	float x2 = mix(c, d, xy.x);
	return mix(x1, x2, xy.y);
}

float pNoise(vec2 p){
	float persistance = .5;
	float n = 0.;
	float normK = 0.;
	float f = 4.;
	float amp = 1.;
	for (int i = 0; i<8; i++){
		n+=amp*noise(p, f);
		f*=2.;
		normK+=amp;
		amp*=persistance;
	}
	float nf = n/normK;
	return nf*nf*nf*nf;
}

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

    // float n = clamp(pNoise(VPos+vec2(8.,4.), 2000), 0., 1.);
    float n = pNoise(VPos+vec2(8.,4.))*20.0;
    float cl=clamp(n,0.0,1.0);
    color *= vec3(cl,cl,cl);

    gl_FragColor = vec4(
        color,
        1.
    );
}
