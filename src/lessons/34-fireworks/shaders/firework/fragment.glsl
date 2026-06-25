uniform sampler2D uTexture;
uniform vec3 uInitialColor;
uniform vec3 uFinalColor;
uniform float uProgress;

varying float vTimeMultiplier;

#include '../includes/remap.glsl

void main()
{
  float textureAlpha = texture(uTexture, gl_PointCoord).r;

  float progress = uProgress;

  // Color change
  float colorProgress = remap(progress, 0.3, 0.8, 0.0, 1.0);
  

  // Final color
  gl_FragColor = vec4(uInitialColor, textureAlpha);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}