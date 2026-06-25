uniform float uTime;
uniform sampler2D uPerlinTexture;
uniform float uSmokeSpeed;
uniform float uWindSpeed;

varying vec2 vUv;

#include ./includes/rotate2D.glsl

void main() 
{
  vec3 newPos = position;

  //Twist
  float twistPerlin = texture(
    uPerlinTexture, 
    vec2(0.5, uv.y * 0.2 - uTime * uSmokeSpeed)
  ).r;
  float angle = twistPerlin * 10.0;
  newPos.xz = rotate2D(newPos.xz, angle);

  //Wind
  vec2 windOffset = vec2(
    texture(uPerlinTexture, vec2(0.25, uTime * uWindSpeed)).r - 0.5,
    texture(uPerlinTexture, vec2(0.75, uTime * uWindSpeed)).r - 0.5
  );
  windOffset *= pow(uv.y, 2.0) * 10.0;
  newPos.xz += windOffset;

  //Final position
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);

  //Varyings
  vUv = uv;
}