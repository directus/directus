uniform vec2 uResolution;
uniform float uTime;
uniform sampler2D uDisplacementTexture;
uniform vec3 uColorPrimary;
uniform vec3 uColorSecondary;

attribute float aIntensity;
attribute float aAngle;

varying vec3 vColor;

// Simplex noise (Ashima Arts)
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

float snoise01(vec2 v) {
  return (1.0 + snoise(v)) * 0.5;
}

float noise2d(vec2 st) {
  return snoise01(vec2(st.x + uTime * 0.02, st.y - uTime * 0.04));
}

// Domain warping — iquilezles.org/articles/warp
float pattern(vec2 p) {
  vec2 q = vec2(
    noise2d(p + vec2(0.0, 0.0)),
    noise2d(p + vec2(5.2, 1.3))
  );
  vec2 r = vec2(
    noise2d(p + 4.0 * q + vec2(1.7, 9.2)),
    noise2d(p + 4.0 * q + vec2(8.3, 2.8))
  );
  return noise2d(p + 1.0 * r);
}

void main() {
  vec3 newPosition = position;

  // --- Blob density (replaces uPictureTexture) ---
  // Blob 1: upper-right, Blob 2: lower-left (matches previous shader layout)
  float blob1 = 1.0 - smoothstep(0.0, 0.35, distance(uv, vec2(0.7, 0.3)));
  float blob2 = 1.0 - smoothstep(0.0, 0.30, distance(uv, vec2(0.15, 0.7)));

  float n = pattern(uv * 2.0 + uTime * 0.03);

  float density1 = smoothstep(0.3, 0.9, blob1 * n * 2.0);
  float density2 = smoothstep(0.3, 0.9, blob2 * n * 2.0);
  float pictureIntensity = max(density1, density2);

  // --- Color: blend primary/secondary based on blob dominance + noise ---
  float colorBlend = density1 / (density1 + density2 + 0.001);
  float noiseBlend = snoise01(uv * 3.0 + uTime * 0.02);
  vColor = mix(uColorSecondary, uColorPrimary, colorBlend * noiseBlend);
  vColor = pow(vColor, vec3(2.0));

  // --- Cursor displacement ---
  float displacementIntensity = texture2D(uDisplacementTexture, uv).r;
  displacementIntensity = smoothstep(0.1, 0.9, displacementIntensity);
  // z=0.0: 2D-only displacement, avoids scaling artifact from normalize()
  vec3 displacement = vec3(cos(aAngle), sin(aAngle), 0.0);
  displacement *= displacementIntensity * 2.0 * aIntensity;
  newPosition += displacement;

  // --- Final position & point size ---
  vec4 modelPosition    = modelMatrix * vec4(newPosition, 1.0);
  vec4 viewPosition     = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;
  gl_Position = projectedPosition;

  gl_PointSize = 0.1 * uResolution.y * pictureIntensity;
  gl_PointSize *= (1.0 / -viewPosition.z);
}
