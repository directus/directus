precision highp float;

varying vec3 vColor;
varying float vMask;

void main() {
  vec2 pc = gl_PointCoord;  // [0, 1] range

  // Hard square clip using Chebyshev distance
  vec2 centered = abs(pc - 0.5);
  float squareDist = max(centered.x, centered.y);
  if (squareDist >= 0.5) discard;

  float alpha = vMask;
  gl_FragColor = vec4(vColor, alpha);
}
