#ifdef GL_ES
precision highp float;
precision highp int;
#endif
#define PI 3.14159265359
const float PHI = 1.61803398874989484820459;
const float SEED = 43758.0;
const float SEED1 = 12.0;
const float SEED2 = 78.0;
const float SEED3 = 437.0;

uniform float u_time;
uniform vec2 u_resolution;
uniform sampler2D img;
uniform float u_colorFreq;
uniform float u_dir;

uniform float u_grid;
uniform float u_clear;
uniform float u_chro;
uniform float u_speed;

uniform vec3 u_col1;
uniform vec3 u_col2;
uniform vec3 u_col3;
uniform vec3 u_col4;


float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(mix(rand(i), rand(i + vec2(1.0, 0.0)), u.x), mix(rand(i + vec2(0.0, 1.0)), rand(i + vec2(1.0, 1.0)), u.x), u.y);
}


float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.8;
    vec2 shift = vec2(10.0);
    for(int i = 0; i < 2; i++) {
        value += amplitude * noise(st);
        st = st * 2.0 + shift + (u_time * (u_speed/4.0)) * u_dir*-1.0;// + u_time * 0.1;
        amplitude *= 0.6;
    }
    return value;
}

vec3 colorGradient(float t) {
    if(t < 0.33) {
        return mix(clamp(u_col1,0.0,1.0), clamp(u_col2,0.0,1.0), t * 3.0);
    } else if(t < 0.66) {
        return mix(clamp(u_col2,0.0,1.0), clamp(u_col3,0.0,1.0), (t - 0.33) * 3.0);
    } else {
        return mix(clamp(u_col3,0.0,1.0), clamp(u_col4,0.0,1.0), (t - 0.66) * 3.0);
    }
}

vec3 applySaturation(vec3 col, float sat){

    float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
    return mix(vec3(luma), col, sat);
}

vec3 applyContrast(vec3 col, float con){

    return (col - 0.5) * con + 0.5;
}



void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;

    vec2 sortedUV = uv;

    float grain = fbm(sortedUV * u_clear);

    float distortion = noise(vec2(sortedUV.x, sortedUV.x) * 5.0 - (u_time * u_speed) * u_dir);

    sortedUV.x += distortion * 0.05;

    float blendScale = u_grid;
    float timeScale = 1.0;
    float blendFactor = noise(vec2(uv.x, uv.y) * blendScale * timeScale);

    float finalPattern;

    finalPattern = mix(grain, distortion, 0.5 * (blendFactor * u_colorFreq));

    finalPattern = clamp(finalPattern, 0.0, 1.0);

    vec3 baseColor = colorGradient(finalPattern);

    vec3 c = baseColor;

    vec3 prevColor = texture2D(img, uv).rgb;

    vec3 frameDifference = c - prevColor;

    vec2 motionVector = frameDifference.rg * 0.1;

    vec2 moshUV = uv + motionVector * rand(uv)/2.0;

    moshUV = mod(moshUV, 1.0);

    vec3 moshColor = texture2D(img, moshUV).rgb;

    float feedbackAmount = 0.9;
    c = mix(c, moshColor, feedbackAmount);

    c = clamp(c, 0.0, 1.0);

    float offset = 1.0 / min(u_resolution.x, u_resolution.y);

    
    
    c = applySaturation(c, 1.01);
    c = applyContrast(c, 1.015);


    float aberrationAmount = 0.002;
    vec2 aberrationOffset = vec2(aberrationAmount, 0.0);

    float r = texture2D(img, uv - offset + vec2(aberrationOffset.x, 0.0)).r;
    float g = texture2D(img, uv - offset).g;
    float b = texture2D(img, uv - offset - vec2(aberrationOffset.x, 0.0)).b;

    vec3 chro = vec3(r, g, b);

    c = mix(c, chro, u_chro);

    c += vec3(0.001);



    c = clamp(c, 0.0, 1.0);

    gl_FragColor = vec4(c, 1.0);


    gl_FragColor = vec4(c, 1.0);
}