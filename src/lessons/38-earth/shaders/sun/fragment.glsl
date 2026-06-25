uniform vec3 uSunColor;
uniform sampler2D uLensFlareTexture;

varying vec2 vUv;

void main() {
    vec4 lensFlareTexture = texture(uLensFlareTexture, vUv);
    float flare = lensFlareTexture.r;
    flare = smoothstep(0.3, 0.8, flare);

    // Final color
    gl_FragColor = vec4(uSunColor, flare);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}