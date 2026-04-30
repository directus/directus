#define PI 3.14159265358979

uniform vec2 uResolution;
uniform float uTime;
uniform sampler2D uDisplacementTexture;
uniform vec3 uColorPrimary;
uniform vec3 uColorSecondary;
uniform float uZoom;
uniform float uSizeContrast;
uniform float uSpeed;
uniform float uSineFrequency;
uniform float uSineSpeed;
uniform float uSineAmplitude;
uniform float uGridCellSize;
uniform float uDisplacementStrength;
uniform float uMinCellSize;
uniform float uMaxCellSize;

attribute float aIntensity;
attribute float aAngle;

varying vec3 vColor;
varying float vMask;

// Ashima Arts simplex noise
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 10.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(
    0.211324865405187,
    0.366025403784439,
    -0.577350269189626,
    0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1  = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// FBM: 4 octaves of simplex noise
float fbm(vec2 p) {
  float v = 0.0, amp = 0.5, freq = 1.0, normFactor = 0.0;
  for (int i = 0; i < 4; i++) {
    v += (snoise(p * freq) * 0.5 + 0.5) * amp;
    normFactor += amp;
    amp *= 0.5;
    freq *= 2.0;
  }
  return v / normFactor;
}

void main() {
  vec3 newPosition = position;
  float t = uTime * uSpeed;

  // --- Domain-warped FBM → waveIntensity ---
  vec2 q = vec2(
    fbm(uv * 2.0 + t * 0.02),
    fbm(uv * 2.0 + vec2(5.2, 1.3) + t * 0.02)
  );
  vec2 r = vec2(
    fbm((uv + 2.0 * q) * 2.0 + vec2(1.7, 9.2)),
    fbm((uv + 2.0 * q) * 2.0 + vec2(8.3, 2.8))
  );
  float waveIntensity = smoothstep(0.05, 0.95, fbm((uv + r) * 2.0 * uZoom));

  // --- Color ---
  float noiseBlend = snoise(uv * 3.0 + t * 0.005) * 0.5 + 0.5;
  vColor = mix(uColorSecondary, uColorPrimary, waveIntensity * noiseBlend);

  // --- Scrolling sine mask ---
  float sineEdge = uSineAmplitude * sin(uv.y * uSineFrequency * PI + uTime * uSineSpeed);
  float maskX = uv.x - (0.45 + sineEdge);
  vMask = smoothstep(-0.05, 0.08, maskX);

  // --- Cursor displacement (subtle) ---
  float displacementIntensity = texture2D(uDisplacementTexture, uv).r;
  displacementIntensity = smoothstep(0.1, 0.9, displacementIntensity);
  vec3 displacement = vec3(cos(aAngle), sin(aAngle), 0.0);
  displacement *= displacementIntensity * uDisplacementStrength * aIntensity;
  newPosition += displacement;

  // --- Final position + point size ---
  vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Size that exactly fills one grid cell (no overlap)
  float baseSize = uGridCellSize * projectionMatrix[1][1] * uResolution.y * 0.5 / (-mvPosition.z);

  float sizeWave = pow(waveIntensity, uSizeContrast);
  float sizeMask = mix(0.05, 1.0, vMask);
  gl_PointSize = clamp(baseSize * sizeWave * sizeMask, uMinCellSize, uMaxCellSize);
}
