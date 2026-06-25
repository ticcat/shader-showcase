import * as THREE from "three";
import waterVertexShader from "./shaders/water/vertex.glsl";
import waterFragmentShader from "./shaders/water/fragment.glsl";

export default {
  name: "29 · Raging Sea",

  config: {
    camera: {
      position: [1, 1, 1],
    },
  },

  init(ctx) {
    // Debug object for color GUI (mirrors original colorDebugObject)
    const colorDebugObject = {
      depthColor: "#186691",
      surfaceColor: "#9bd8ff",
    };

    // Geometry
    const waterGeometry = new THREE.PlaneGeometry(2, 2, 512, 512);

    // Material
    const waterMaterial = new THREE.ShaderMaterial({
      vertexShader: waterVertexShader,
      fragmentShader: waterFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uBigWavesElevation: { value: 0.2 },
        uBigWavesFrequency: { value: new THREE.Vector2(4, 1.5) },
        uBigWavesSpeed: { value: 0.75 },
        uSmallWavesElevation: { value: 0.15 },
        uSmallWavesFrequency: { value: 3 },
        uSmallWavesSpeed: { value: 0.2 },
        uSmallWavesIterations: { value: 4 },
        uDepthColor: { value: new THREE.Color(colorDebugObject.depthColor) },
        uSurfaceColor: { value: new THREE.Color(colorDebugObject.surfaceColor) },
        uColorOffset: { value: 0.08 },
        uColorMultiplier: { value: 5 },
      },
    });

    // GUI folders
    const bigWavesGui = ctx.gui.addFolder("Big waves");
    const smallWavesGui = ctx.gui.addFolder("Small waves");
    const colorGui = ctx.gui.addFolder("Color");

    bigWavesGui
      .add(waterMaterial.uniforms.uBigWavesElevation, "value")
      .min(0)
      .max(1)
      .step(0.001)
      .name("uBigWavesElevation");
    bigWavesGui
      .add(waterMaterial.uniforms.uBigWavesFrequency.value, "x")
      .min(0)
      .max(10)
      .step(0.001)
      .name("uBigWavesFrequency x");
    bigWavesGui
      .add(waterMaterial.uniforms.uBigWavesFrequency.value, "y")
      .min(0)
      .max(10)
      .step(0.001)
      .name("uBigWavesFrequency y");
    bigWavesGui
      .add(waterMaterial.uniforms.uBigWavesSpeed, "value")
      .min(0)
      .max(4)
      .step(0.001)
      .name("uBigWavesSpeed");

    smallWavesGui
      .add(waterMaterial.uniforms.uSmallWavesElevation, "value")
      .min(0)
      .max(1)
      .step(0.001)
      .name("uSmallWavesElevation");
    smallWavesGui
      .add(waterMaterial.uniforms.uSmallWavesFrequency, "value")
      .min(0)
      .max(30)
      .step(0.001)
      .name("uSmallWavesFrequency");
    smallWavesGui
      .add(waterMaterial.uniforms.uSmallWavesSpeed, "value")
      .min(0)
      .max(4)
      .step(0.001)
      .name("uSmallWavesSpeed");
    smallWavesGui
      .add(waterMaterial.uniforms.uSmallWavesIterations, "value")
      .min(0)
      .max(5)
      .step(1)
      .name("uSmallIterations");

    colorGui
      .addColor(colorDebugObject, "depthColor")
      .onChange(() => {
        waterMaterial.uniforms.uDepthColor.value.set(colorDebugObject.depthColor);
      });
    colorGui
      .addColor(colorDebugObject, "surfaceColor")
      .onChange(() => {
        waterMaterial.uniforms.uSurfaceColor.value.set(colorDebugObject.surfaceColor);
      });
    colorGui
      .add(waterMaterial.uniforms.uColorOffset, "value")
      .min(0)
      .max(1)
      .step(0.001)
      .name("uColorOffset");
    colorGui
      .add(waterMaterial.uniforms.uColorMultiplier, "value")
      .min(0)
      .max(10)
      .step(0.001)
      .name("uColorMultiplier");

    // Mesh
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI * 0.5;
    ctx.scene.add(water);

    // Store refs for update/dispose
    this._waterMaterial = waterMaterial;
    this._water = water;
  },

  update(elapsed) {
    this._waterMaterial.uniforms.uTime.value = elapsed;
  },

  dispose() {
    // Engine's disposeObject safety net handles geometry, material, and textures.
    this._waterMaterial = null;
    this._water = null;
  },
};
