uniform float uTime;
uniform vec3 uColor;

varying vec3 vNormal;
varying vec3 vPosition;

#include "../includes/lights/ambientLight.glsl"
#include "../includes/lights/directionalLight.glsl"
#include "../includes/lights/pointLight.glsl"

void main()
{
    vec3 normal = normalize(vNormal);
    vec3 viewDirection = normalize(vPosition - cameraPosition);

    vec3 color = uColor;

    // Lights
    vec3 light = vec3(0.0);

    light += ambientLight(
        vec3(1.0),  // Light color
        0.03        // Light intensity
    );

    light += directionalLight(
        vec3(0.1, 0.1, 1.0),    // Light color
        1.0,                    // Light intensity
        normal,                 // Normal
        vec3(0.0, 0.0, 3.0),    // Light position
        viewDirection,          // View direction
        20.0                    // Specular power
    );

    light += pointLight(
        vec3(1.0, 0.1, 0.1),    // Light color
        1.0,                    // Light intensity
        normal,                 // Normal
        vec3(sin(uTime) * 3.0, 2.5, cos(uTime) * 3.0),    // Light position
        viewDirection,          // View direction
        20.0,                   // Specular power
        vPosition,              // Position
        0.25                    // Position
    );

    light += pointLight(
        vec3(0.1, 1.0, 0.5),    // Light color
        1.0,                    // Light intensity
        normal,                 // Normal
        vec3(sin(-uTime), -2.5, cos(-uTime)),    // Light position
        viewDirection,          // View direction
        20.0,                   // Specular power
        vPosition,              // Position
        0.25                    // Position
    );

    color *= light;

    // Final color
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}