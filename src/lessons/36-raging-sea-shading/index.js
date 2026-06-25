import * as THREE from "three";
import waterVertexShader from "./shaders/water/vertex.glsl";
import waterFragmentShader from "./shaders/water/fragment.glsl";

export default {
  name: "36 · Raging Sea Shading",

  config: {
    toneMapping: "ACESFilmic",
    camera: {
      position: [1, 1, 1],
    },
  },

  init(ctx) {
    // Debug object for color GUI (mirrors original debugObject)
    const debugObject = {};
    debugObject.depthColor = "#ff4000";
    debugObject.surfaceColor = "#151c37";

    // Geometry
    const waterGeometry = new THREE.PlaneGeometry(2, 2, 512, 512);
    waterGeometry.deleteAttribute("normal");

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
        uSmallIterations: { value: 4 },

        uDepthColor: { value: new THREE.Color(debugObject.depthColor) },
        uSurfaceColor: { value: new THREE.Color(debugObject.surfaceColor) },
        uColorOffset: { value: 0.925 },
        uColorMultiplier: { value: 1 },
      },
    });

    // GUI — mirrors original (no folders, all at root level)
    ctx.gui.addColor(debugObject, "depthColor").onChange(() => {
      waterMaterial.uniforms.uDepthColor.value.set(debugObject.depthColor);
    });
    ctx.gui.addColor(debugObject, "surfaceColor").onChange(() => {
      waterMaterial.uniforms.uSurfaceColor.value.set(debugObject.surfaceColor);
    });

    ctx.gui
      .add(waterMaterial.uniforms.uBigWavesElevation, "value")
      .min(0)
      .max(1)
      .step(0.001)
      .name("uBigWavesElevation");
    ctx.gui
      .add(waterMaterial.uniforms.uBigWavesFrequency.value, "x")
      .min(0)
      .max(10)
      .step(0.001)
      .name("uBigWavesFrequencyX");
    ctx.gui
      .add(waterMaterial.uniforms.uBigWavesFrequency.value, "y")
      .min(0)
      .max(10)
      .step(0.001)
      .name("uBigWavesFrequencyY");
    ctx.gui
      .add(waterMaterial.uniforms.uBigWavesSpeed, "value")
      .min(0)
      .max(4)
      .step(0.001)
      .name("uBigWavesSpeed");

    ctx.gui
      .add(waterMaterial.uniforms.uSmallWavesElevation, "value")
      .min(0)
      .max(1)
      .step(0.001)
      .name("uSmallWavesElevation");
    ctx.gui
      .add(waterMaterial.uniforms.uSmallWavesFrequency, "value")
      .min(0)
      .max(30)
      .step(0.001)
      .name("uSmallWavesFrequency");
    ctx.gui
      .add(waterMaterial.uniforms.uSmallWavesSpeed, "value")
      .min(0)
      .max(4)
      .step(0.001)
      .name("uSmallWavesSpeed");
    ctx.gui
      .add(waterMaterial.uniforms.uSmallIterations, "value")
      .min(0)
      .max(5)
      .step(1)
      .name("uSmallIterations");

    ctx.gui
      .add(waterMaterial.uniforms.uColorOffset, "value")
      .min(0)
      .max(1)
      .step(0.001)
      .name("uColorOffset");
    ctx.gui
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
