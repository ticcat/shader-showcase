#include '../includes/simplexNoise2d.glsl'

varying vec3 vPosition;

void main() {
  // Color
  vec3 color = vec3(1.0);

  // Noise
  float cloudNoise = simplexNoise2d(vPosition.xy);

  // Final color
  csm_DiffuseColor = vec4(color, cloudNoise);
}
