varying vec2 vUv;

#define PI 3.1415926535897932384626433832795

float random(vec2 st)
{
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43658.5453123);
}

vec2 rotate(vec2 uv, float rotation, vec2 mid)
{
    return vec2(
      cos(rotation) * (uv.x - mid.x) + sin(rotation) * (uv.y - mid.y) + mid.x,
      cos(rotation) * (uv.y - mid.y) - sin(rotation) * (uv.x - mid.x) + mid.y
    );
}

vec4 permute(vec4 x) {
    return mod(((x * 34.0) + 1.0) * x, 289.0);
}

vec2 fade(vec2 t)
{
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

float cnoise(vec2 P)
{
    vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
    vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
    Pi = mod(Pi, 289.0); // To avoid truncation effects in permutation

    vec4 ix = Pi.xzxz;
    vec4 iy = Pi.yyww;
    vec4 fx = Pf.xzxz;
    vec4 fy = Pf.yyww;
    vec4 i = permute(permute(ix) + iy);
    vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0; // 1/41 = 0.024...
    vec4 gy = abs(gx) - 0.5;
    vec4 tx = floor(gx + 0.5);
    gx = gx - tx;

    vec2 g00 = vec2(gx.x, gy.x);
    vec2 g10 = vec2(gx.y, gy.y);
    vec2 g01 = vec2(gx.z, gy.z);
    vec2 g11 = vec2(gx.w, gy.w);
    vec4 norm = 1.79284291400159 - 0.85373472095314 * vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));

    g00 *= norm.x;
    g01 *= norm.y;
    g10 *= norm.z;
    g11 *= norm.w;

    float n00 = dot(g00, vec2(fx.x, fy.x));
    float n10 = dot(g10, vec2(fx.y, fy.y));
    float n01 = dot(g01, vec2(fx.z, fy.z));
    float n11 = dot(g11, vec2(fx.w, fy.w));

    vec2 fade_xy = fade(Pf.xy);
    vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
    float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
    return 2.3 * n_xy;
}

void main()
{
    vec3 blackColor = vec3(0.0);
    vec3 uvColor = vec3(vUv, 1.0);

    // Pattern 1
    gl_FragColor = vec4(vUv, 1.0, 1.0);

    // Pattern 2
    gl_FragColor = vec4(vUv, 0.0, 1.0);

    // Pattern 3
    float strength3 = vUv.x;
    gl_FragColor = vec4(vec3(strength3), 1.0);

    // Pattern 4
    float strength4 = vUv.y;
    gl_FragColor = vec4(vec3(strength4), 1.0);

    // Pattern 5
    float strength5 = 1.0 - vUv.y;
    gl_FragColor = vec4(vec3(strength5), 1.0);

    // Pattern 6
    float strength6 = vUv.y * 10.0;
    gl_FragColor = vec4(vec3(strength6), 1.0);

    // Pattern 7
    float strength7 = mod(vUv.y * 10.0, 1.0);
    gl_FragColor = vec4(vec3(strength7), 1.0);

    // Pattern 8
    float strength8 = mod(vUv.y * 10.0, 1.0);
    strength8 = step(0.5, strength8);
    gl_FragColor = vec4(vec3(strength8), 1.0);

    // Pattern 9
    float strength9 = mod(vUv.y * 10.0, 1.0);
    strength9 = step(0.8, strength9);
    gl_FragColor = vec4(vec3(strength9), 1.0);

    // Pattern 10
    float strength10 = mod(vUv.x * 10.0, 1.0);
    strength10 = step(0.8, strength10);
    gl_FragColor = vec4(vec3(strength10), 1.0);

    // Pattern 11
    float strength11 = step(0.8, mod(vUv.x * 10.0, 1.0));
    strength11 += step(0.8, mod(vUv.y * 10.0, 1.0));
    gl_FragColor = vec4(vec3(strength11), 1.0);

    // Pattern 12
    float strength12 = step(0.8, mod(vUv.x * 10.0, 1.0));
    strength12 *= step(0.8, mod(vUv.y * 10.0, 1.0));
    gl_FragColor = vec4(vec3(strength12), 1.0);

    // Pattern 13
    float strength13 = step(0.4, mod(vUv.x * 10.0, 1.0));
    strength13 *= step(0.8, mod(vUv.y * 10.0, 1.0));
    gl_FragColor = vec4(vec3(strength13), 1.0);

    // // Pattern 14
    float barX14 = step(0.4, mod(vUv.x * 10.0, 1.0)) * step(0.8, mod(vUv.y * 10.0, 1.0));
    float barY14 = step(0.8, mod(vUv.x * 10.0, 1.0)) * step(0.4, mod(vUv.y * 10.0, 1.0));
    float strength14 = barX14 + barY14;
    gl_FragColor = vec4(vec3(strength14), 1.0);

    // // Pattern 15
    float barX15 = step(0.4, mod(vUv.x * 10.0 - 0.2, 1.0)) * step(0.8, mod(vUv.y * 10.0, 1.0));
    float barY15 = step(0.8, mod(vUv.x * 10.0, 1.0)) * step(0.4, mod(vUv.y * 10.0 - 0.2, 1.0));
    float strength15 = barX15 + barY15;
    gl_FragColor = vec4(vec3(strength15), 1.0);

    // Pattern 16
    float strength16 = abs(vUv.x - 0.5);
    gl_FragColor = vec4(vec3(strength16), 1.0);

    // Pattern 17
    float strength17 = min(abs(vUv.x - 0.5), abs(vUv.y - 0.5));
    gl_FragColor = vec4(vec3(strength17), 1.0);

    // Pattern 18
    float strength18 = max(abs(vUv.x - 0.5), abs(vUv.y - 0.5));
    gl_FragColor = vec4(vec3(strength18), 1.0);

    // Pattern 19
    float strength19 = max(abs(vUv.x - 0.5), abs(vUv.y - 0.5));
    strength19 = step(0.2, strength19);
    gl_FragColor = vec4(vec3(strength19), 1.0);

    // Pattern 20
    float strength20 = step(0.2, max(abs(vUv.x - 0.5), abs(vUv.y - 0.5)));
    strength20 *= 1.0 - step(0.25, max(abs(vUv.x - 0.5), abs(vUv.y - 0.5)));
    gl_FragColor = vec4(vec3(strength20), 1.0);

    // Pattern 21
    float strength21 = floor(vUv.x * 10.0)/ 10.0;
    gl_FragColor = vec4(vec3(strength21), 1.0);

    // Pattern 22
    float strength22 = floor(vUv.x * 10.0) / 10.0;
    strength22 *= floor(vUv.y * 10.0) / 10.0;
    gl_FragColor = vec4(vec3(strength22), 1.0);

    // Pattern 23
    float strength23 = random(vUv);
    gl_FragColor = vec4(vec3(strength23), 1.0);

    // Pattern 24
    float gridSize24 = 10.0;
    vec2 gridUv24 = vec2(floor(vUv.x * gridSize24) / gridSize24, floor(vUv.y * gridSize24) / gridSize24);
    float strength24 = random(gridUv24);
    gl_FragColor = vec4(vec3(strength24), 1.0);

    // Pattern 25
    float gridSize25 = 10.0;
    vec2 gridUv25 = vec2(floor(vUv.x * gridSize25) / gridSize25, floor((vUv.y + vUv.x * 0.5) * gridSize25) / gridSize25);
    float strength25 = random(gridUv25);
    gl_FragColor = vec4(vec3(strength25), 1.0);

    // Pattern 26
    float strength26 = length(vUv);
    gl_FragColor = vec4(vec3(strength26), 1.0);

    // Pattern 27
    float strength27 = distance(vUv, vec2(0.5));
    gl_FragColor = vec4(vec3(strength27), 1.0);

    // Pattern 28
    float strength28 = 1.0 - distance(vUv, vec2(0.5));
    gl_FragColor = vec4(vec3(strength28), 1.0);

    // Pattern 29
    float strength29 = 0.015 / distance(vUv, vec2(0.5));
    gl_FragColor = vec4(vec3(strength29), 1.0);

    // Pattern 30
    float strength30 = 0.15 / (distance(vec2(vUv.x, (vUv.y - 0.5) * 5.0 + 0.5), vec2(0.5)));
    gl_FragColor = vec4(vec3(strength30), 1.0);

    // Pattern 31
    float strength31 = 0.15 / (distance(vec2(vUv.x, (vUv.y - 0.5) * 5.0 + 0.5), vec2(0.5)));
    strength31 *= 0.15 / (distance(vec2(vUv.y, (vUv.x - 0.5) * 5.0 + 0.5), vec2(0.5)));
    gl_FragColor = vec4(vec3(strength31), 1.0);

    // Pattern 32
    vec2 rotatedUv32 = rotate(vUv, PI * 0.25, vec2(0.5));
    float strength32 = 0.15 / (distance(vec2(rotatedUv32.x, (rotatedUv32.y - 0.5) * 5.0 + 0.5), vec2(0.5)));
    strength32 *= 0.15 / (distance(vec2(rotatedUv32.y, (rotatedUv32.x - 0.5) * 5.0 + 0.5), vec2(0.5)));
    gl_FragColor = vec4(vec3(strength32), 1.0);

    // Pattern 33
    float strength33 = step(0.5, distance(vUv, vec2(0.5)) + 0.25);
    gl_FragColor = vec4(vec3(strength33), 1.0);

    // Pattern 34
    float strength34 = abs(distance(vUv, vec2(0.5)) - 0.25);
    gl_FragColor = vec4(vec3(strength34), 1.0);

    // Pattern 35
    float strength35 = step(0.02, abs(distance(vUv, vec2(0.5)) - 0.25));
    gl_FragColor = vec4(vec3(strength35), 1.0);

    // Pattern 36
    float strength36 = 1.0 - step(0.02, abs(distance(vUv, vec2(0.5)) - 0.25));
    gl_FragColor = vec4(vec3(strength36), 1.0);

    // Pattern 37
    vec2 wavedUv37 = vec2(
        vUv.x,
        vUv.y + sin(vUv.x * 30.0) * 0.1
    );
    float strength37 = 1.0 - step(0.02, abs(distance(wavedUv37, vec2(0.5)) - 0.25));
    gl_FragColor = vec4(vec3(strength37), 1.0);

    // Pattern 38
    vec2 wavedUv38 = vec2(
        vUv.x + sin(vUv.y * 30.0) * 0.1,
        vUv.y + sin(vUv.x * 30.0) * 0.1
    );
    float strength38 = 1.0 - step(0.02, abs(distance(wavedUv38, vec2(0.5)) - 0.25));
    gl_FragColor = vec4(vec3(strength38), 1.0);

    // Pattern 39
    float sinStrength = 100.0;
    vec2 wavedUv39 = vec2(
        vUv.x + sin(vUv.y * sinStrength) * 0.1,
        vUv.y + sin(vUv.x * sinStrength) * 0.1
    );
    float strength39 = 1.0 - step(0.01, abs(distance(wavedUv39, vec2(0.5)) - 0.25));
    gl_FragColor = vec4(vec3(strength39), 1.0);

    // Pattern 40
    float angle40 = atan(vUv.x, vUv.y);
    float strength40 = angle40;
    gl_FragColor = vec4(vec3(strength40), 1.0);

    // Pattern 41
    float angle41 = atan(vUv.x - 0.5, vUv.y - 0.5);
    float strength41 = angle41;
    gl_FragColor = vec4(vec3(strength41), 1.0);

    // Pattern 42
    float angle42 = atan(vUv.x - 0.5, vUv.y - 0.5);
    angle42 /= PI * 2.0;
    angle42 += 0.5;
    float strength42 = angle42;
    gl_FragColor = vec4(vec3(strength42), 1.0);

    // Pattern 43
    float angle43 = atan(vUv.x - 0.5, vUv.y - 0.5);
    angle43 /= PI * 2.0;
    angle43 += 0.5;
    float strength43 = mod(angle43 * 20.0, 1.0);
    gl_FragColor = vec4(vec3(strength43), 1.0);

    // Pattern 44
    float angle44 = atan(vUv.x - 0.5, vUv.y - 0.5);
    angle44 /= PI * 2.0;
    angle44 += 0.5;
    float strength44 = sin(angle44 * 100.0);
    gl_FragColor = vec4(vec3(strength44), 1.0);

    // Pattern 45
    float angle45 = atan(vUv.x - 0.5, vUv.y - 0.5) / (PI * 2.0) + 0.5;
    float radius45 = 0.25 + sin(angle45 * 100.0) * 0.02;
    float strength45 = 1.0 - step(0.01, abs(distance(vUv, vec2(0.5)) - radius45));
    gl_FragColor = vec4(vec3(strength45), 1.0);

    // Pattern 46
    float strength46 = cnoise(vUv * 10.0);
    gl_FragColor = vec4(vec3(strength46), 1.0);

    // Pattern 47
    float strength47 = cnoise(vUv * 10.0);
    strength47 = step(0.0, strength47);
    gl_FragColor = vec4(vec3(strength47), 1.0);

    // Pattern 48
    float strength48 = 1.0 - abs(cnoise(vUv * 10.0));
    gl_FragColor = vec4(vec3(strength48), 1.0);

    // Pattern 49
    float strength49 = sin(cnoise(vUv * 10.0) * 20.0);
    gl_FragColor = vec4(vec3(strength49), 1.0);

    // Pattern 50
    float strength50 = step(0.9, sin(cnoise(vUv * 10.0) * 20.0));
    gl_FragColor = vec4(vec3(strength50), 1.0);

    gl_FragColor = vec4(vec3(strength10), 1.0);

    vec3 mixedColor = mix(blackColor, uvColor, strength48);

}
