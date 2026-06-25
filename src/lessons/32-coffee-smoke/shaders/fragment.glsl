uniform float uTime;
uniform float uSmokeSpeed;
uniform sampler2D uPerlinTexture;
uniform vec3 uSmokeColor;

varying vec2 vUv;

void main()
{
  vec2 smokeUv = vUv;
  smokeUv.x *= 0.5;
  smokeUv.y *= 0.3;
  smokeUv.y -= uTime * uSmokeSpeed;

  float smoke = texture(uPerlinTexture, smokeUv).r;

  //Remap
  // smoke = step(0.4, smoke);
  smoke = smoothstep(0.4, 1.0, smoke);

  //Edges
  smoke *= smoothstep(0.0, 0.1, vUv.x);
  smoke *= smoothstep(1.0, 0.9, vUv.x);
  smoke *= smoothstep(0.0, 0.1, vUv.y);
  smoke *= smoothstep(1.0, 0.4, vUv.y);

  // Final color
  gl_FragColor = vec4(uSmokeColor, smoke);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}