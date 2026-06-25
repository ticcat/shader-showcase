import * as THREE from "three";
import vertexShader from "./shaders/test/vertex.glsl";
import fragmentShader from "./shaders/test/fragment.glsl";

export default {
  name: "28 · Shader Patterns",

  config: {
    camera: {
      position: [0.25, -0.25, 1],
      fov: 75,
      near: 0.1,
      far: 100,
    },
  },

  init(ctx) {
    // Geometry
    const geometry = new THREE.PlaneGeometry(1, 1, 32, 32);

    // Material — no uniforms; patterns are purely UV-based (no animation)
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
    });

    // Mesh
    const mesh = new THREE.Mesh(geometry, material);
    ctx.scene.add(mesh);

    // Store refs for dispose
    this._geometry = geometry;
    this._material = material;
    this._mesh = mesh;
  },

  // No update() — the original tick() contains only controls.update() and
  // renderer.render(), both of which are engine-owned. There are no per-frame
  // uniforms in this lesson.

  dispose() {
    // Engine's disposeObject safety net handles geometry and material.
    this._geometry = null;
    this._material = null;
    this._mesh = null;
  },
};
