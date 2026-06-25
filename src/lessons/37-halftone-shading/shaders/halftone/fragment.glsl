uniform vec2 uResolution;
uniform vec3 uColor;
uniform float uShadowRepetitions;
uniform float uLightRepetitions;
uniform vec3 uShadowColor;
uniform vec3 uLightColor;

varying vec3 vNormal;
varying vec3 vPosition;

#include "../includes/ambientLight.glsl"
#include "../includes/directionalLight.glsl"
#include "../includes/halftone.glsl"

void main()
{
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    vec3 normal = normalize(vNormal);
    vec3 color = uColor;

    // Lights
    vec3 light = vec3(0.0);
    
    light += ambientLight(
        vec3(1.0),              // Color
        1.0                     // Intensity
    );

    light += directionalLight(
        vec3(1.0),              // Color
        1.0,                    // Intensity
        normal,                 // Normal
        vec3(1.0, 1.0, 0.0),    // Position
        viewDirection,          // View direction
        1.0                     // Specular power
    );

    color *= light;

    // Halftone
    color = halftone(color, uShadowRepetitions, vec3(-1.0, -1.0, 0.0), -0.8, 1.5, uShadowColor, normal);
    color = halftone(color, uLightRepetitions, vec3(1.0, 1.0, 0.0), 0.8, 1.5, uLightColor, normal);

    // Final color
    gl_FragColor = vec4(color, 1.0);
    gl_FragColor = vec4(color, 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}