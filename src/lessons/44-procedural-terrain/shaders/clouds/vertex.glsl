uniform float uTime;
uniform float uSpeed;

varying vec3 vPosition;

void main() {
  // Varyings
  vPosition = csm_Position;
  vPosition.xy += uTime * uSpeed;
}
