uniform sampler2D positions;
uniform float uPointSize;
attribute vec3 color;
varying vec3 vColor;
varying vec3 vPos;
varying vec2 vParticleScreenPos;
varying vec2 projectedPos;

void main() {
  vColor = color;

  vec3 pos = texture2D(positions, position.xy).xyz;
  vPos = pos;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  vec4 projectedPos = projectionMatrix * mvPosition;

  vParticleScreenPos = projectedPos.xy / projectedPos.w;

  gl_Position = projectedPos;
  gl_PointSize = uPointSize;
}