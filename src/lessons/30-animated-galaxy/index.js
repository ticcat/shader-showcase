import * as THREE from "three";
import galaxyVertexShader from "./shaders/galaxy/vertex.glsl";
import galaxyFragmentShader from "./shaders/galaxy/fragment.glsl";

export default {
  name: "30 · Animated Galaxy",

  config: {
    camera: {
      position: [3, 3, 3],
    },
  },

  init(ctx) {
    const parameters = {};
    parameters.count = 200000;
    parameters.size = 0.005;
    parameters.radius = 5;
    parameters.branches = 3;
    parameters.spin = 1;
    parameters.randomness = 0.5;
    parameters.randomnessPower = 3;
    parameters.insideColor = "#ff6030";
    parameters.outsideColor = "#1b3984";

    // Store on this so update/dispose can reach them
    this._geometry = null;
    this._material = null;
    this._points = null;

    // GUI folders (mirrors original galaxyGui / shaderGui)
    const galaxyGui = ctx.gui.addFolder("Galaxy");
    const shaderGui = ctx.gui.addFolder("Shader");

    const generateGalaxy = () => {
      // Dispose old before regenerating (preserve original guard)
      if (this._points !== null) {
        this._geometry.dispose();
        this._material.dispose();
        ctx.scene.remove(this._points);
      }

      /**
       * Geometry
       */
      const geometry = new THREE.BufferGeometry();

      const positions = new Float32Array(parameters.count * 3);
      const randomness = new Float32Array(parameters.count * 3);
      const colors = new Float32Array(parameters.count * 3);
      const scales = new Float32Array(parameters.count * 1);

      const insideColor = new THREE.Color(parameters.insideColor);
      const outsideColor = new THREE.Color(parameters.outsideColor);

      for (let i = 0; i < parameters.count; i++) {
        const i3 = i * 3;

        // Position
        const radius = Math.random() * parameters.radius;

        const branchAngle =
          ((i % parameters.branches) / parameters.branches) * Math.PI * 2;

        const randomX =
          Math.pow(Math.random(), parameters.randomnessPower) *
          (Math.random() < 0.5 ? 1 : -1) *
          parameters.randomness *
          radius;
        const randomY =
          Math.pow(Math.random(), parameters.randomnessPower) *
          (Math.random() < 0.5 ? 1 : -1) *
          parameters.randomness *
          radius;
        const randomZ =
          Math.pow(Math.random(), parameters.randomnessPower) *
          (Math.random() < 0.5 ? 1 : -1) *
          parameters.randomness *
          radius;

        positions[i3] = Math.cos(branchAngle) * radius;
        positions[i3 + 1] = 0;
        positions[i3 + 2] = Math.sin(branchAngle) * radius;

        randomness[i3] = randomX;
        randomness[i3 + 1] = randomY;
        randomness[i3 + 2] = randomZ;

        // Color
        const mixedColor = insideColor.clone();
        mixedColor.lerp(outsideColor, radius / parameters.radius);

        colors[i3] = mixedColor.r;
        colors[i3 + 1] = mixedColor.g;
        colors[i3 + 2] = mixedColor.b;

        // Scale
        scales[i] = Math.random();
      }

      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute(
        "aRandomness",
        new THREE.BufferAttribute(randomness, 3)
      );
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));

      /**
       * Material
       */
      const material = new THREE.ShaderMaterial({
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        vertexShader: galaxyVertexShader,
        fragmentShader: galaxyFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uSize: { value: 30 * ctx.renderer.getPixelRatio() },
        },
      });

      shaderGui
        .add(material.uniforms.uSize, "value")
        .min(1)
        .max(8)
        .step(0.001)
        .name("uSize");

      /**
       * Points
       */
      const points = new THREE.Points(geometry, material);
      ctx.scene.add(points);

      // Store refs on this
      this._geometry = geometry;
      this._material = material;
      this._points = points;
    };

    // Galaxy GUI controls (verbatim from original, .onFinishChange(generateGalaxy))
    galaxyGui
      .add(parameters, "count")
      .min(100)
      .max(1000000)
      .step(100)
      .onFinishChange(generateGalaxy);
    galaxyGui
      .add(parameters, "radius")
      .min(0.01)
      .max(20)
      .step(0.01)
      .onFinishChange(generateGalaxy);
    galaxyGui
      .add(parameters, "branches")
      .min(2)
      .max(20)
      .step(1)
      .onFinishChange(generateGalaxy);
    galaxyGui
      .add(parameters, "randomness")
      .min(0)
      .max(2)
      .step(0.001)
      .onFinishChange(generateGalaxy);
    galaxyGui
      .add(parameters, "randomnessPower")
      .min(1)
      .max(10)
      .step(0.001)
      .onFinishChange(generateGalaxy);
    galaxyGui.addColor(parameters, "insideColor").onFinishChange(generateGalaxy);
    galaxyGui.addColor(parameters, "outsideColor").onFinishChange(generateGalaxy);

    // Generate the galaxy once
    generateGalaxy();
  },

  update(elapsed) {
    if (this._material) {
      this._material.uniforms.uTime.value = elapsed;
    }
  },

  dispose() {
    if (this._geometry) this._geometry.dispose();
    if (this._material) this._material.dispose();
    this._geometry = null;
    this._material = null;
    this._points = null;
  },
};
