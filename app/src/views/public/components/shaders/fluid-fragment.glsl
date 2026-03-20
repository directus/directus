precision highp float;

varying vec3 vColor;

void main() {
  vec2 pc = gl_PointCoord;
  float edge = min(min(pc.x, 1.0 - pc.x), min(pc.y, 1.0 - pc.y));
  float alpha = smoothstep(0.0, 0.15, edge);
  gl_FragColor = vec4(vColor, alpha);
}
