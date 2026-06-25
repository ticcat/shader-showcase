varying vec3 vColor;

void main()
{
    float strength = 0.0;

    // Disc patter
    // strength = distance(gl_PointCoord, vec2(0.5));
    // strength = step(0.5, strength);
    // strength = 1.0 - strength;

    // Diffuse point
    // strength = distance(gl_PointCoord, vec2(0.5));
    // strength *= 2.0;
    // strength = 1.0 - strength;

    // Light point
    strength = distance(gl_PointCoord, vec2(0.5));
    strength = 1.0 - strength;
    strength = pow(strength, 10.0);

    // Color
    vec3 color = mix(vec3(0.0), vColor, strength);

    gl_FragColor = vec4(color, 1.0);

    #include <colorspace_fragment>
}
