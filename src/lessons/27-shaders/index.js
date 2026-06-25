import * as THREE from "three";
import vertexShader from "./shaders/test/vertex.glsl";
import fragmentShader from "./shaders/test/fragment.glsl";

export default {
  name: "27 · Shaders",

  config: {
    camera: {
      position: [0.25, -0.25, 1],
      fov: 75,
      near: 0.1,
      far: 100,
    },
  },

  init(ctx) {
    // Texture
    const flagTexture = ctx.loaders.texture.load(
      new URL("./assets/flag-french.jpg", import.meta.url).href
    );

    // Geometry
    const geometry = new THREE.PlaneGeometry(1, 1, 32, 32);
    const count = geometry.attributes.position.count;
    const randoms = new Float32Array(count);
    // randoms left as zeros (matching the commented-out loop in the original)
    geometry.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));

    // Material
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      uniforms: {
        uFrequency: { value: new THREE.Vector2(10, 5) },
        uTime: { value: 0 },
        uColor: { value: new THREE.Color("orange") },
        uTexture: { value: flagTexture },
      },
    });

    // GUI
    ctx.gui
      .add(material.uniforms.uFrequency.value, "x")
      .min(0)
      .max(20)
      .step(0.01)
      .name("freqX");
    ctx.gui
      .add(material.uniforms.uFrequency.value, "y")
      .min(0)
      .max(20)
      .step(0.01)
      .name("freqY");

    // Mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.y = 2 / 3;
    ctx.scene.add(mesh);

    // Store refs for update/dispose
    this._material = material;
    this._mesh = mesh;
  },

  update(elapsed) {
    this._material.uniforms.uTime.value = elapsed;
  },

  dispose() {
    // Engine's disposeObject safety net handles geometry, material, and texture.
    // Nothing else to clean up.
    this._material = null;
    this._mesh = null;
  },
};
