import * as THREE from "three";
import holoVertexShader from "./shaders/holographic/vertex.glsl";
import holoFragmentShader from "./shaders/holographic/fragment.glsl";

// Asset URL — resolved at build time via Vite's import.meta.url
const modelUrl = new URL("./assets/suzanne.glb", import.meta.url).href;

export default {
  name: "33 · Hologram",

  config: {
    // Original: rendererParameters.clearColor = "#1d1f2a"
    clearColor: "#1d1f2a",
    // Original: camera.position.set(7, 7, 7), fov = 25, near = 0.1, far = 100
    camera: {
      position: [7, 7, 7],
      fov: 25,
      near: 0.1,
      far: 100,
    },
    // No toneMapping set in original — use engine default
  },

  init(ctx) {
    // -----------------------------------------------------------------------
    // Clear-color GUI (original: gui.addColor(rendererParameters, "clearColor")
    // .onChange(() => renderer.setClearColor(rendererParameters.clearColor)))
    // Reproduced via a local rendererParameters object wired to ctx.renderer
    // -----------------------------------------------------------------------
    const rendererParameters = { clearColor: "#1d1f2a" };
    ctx.gui.addColor(rendererParameters, "clearColor").onChange(() => {
      ctx.renderer.setClearColor(rendererParameters.clearColor);
    });

    // -----------------------------------------------------------------------
    // Material parameters (original: materialParams.color = "#70c1ff")
    // -----------------------------------------------------------------------
    const materialParams = {};
    materialParams.color = "#70c1ff";

    // -----------------------------------------------------------------------
    // Holographic ShaderMaterial (verbatim uniforms from original script.js)
    // -----------------------------------------------------------------------
    const material = new THREE.ShaderMaterial({
      vertexShader: holoVertexShader,
      fragmentShader: holoFragmentShader,
      uniforms: {
        uTime: new THREE.Uniform(0),
        uStripes: new THREE.Uniform(20),
        uSpeed: new THREE.Uniform(0.02),
        uHoloStrength: new THREE.Uniform(1.25),
        uColor: new THREE.Uniform(new THREE.Color(materialParams.color)),
        uGlitchStrength: new THREE.Uniform(0.25),
      },
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    // -----------------------------------------------------------------------
    // GUI — Fragment folder (original lines 103-126)
    // -----------------------------------------------------------------------
    const fragmentGui = ctx.gui.addFolder("Fragment");
    fragmentGui
      .add(material.uniforms.uStripes, "value")
      .min(2)
      .max(100)
      .step(1)
      .name("uStripes");
    fragmentGui
      .add(material.uniforms.uSpeed, "value")
      .min(0)
      .max(0.5)
      .step(0.01)
      .name("uSpeed");
    fragmentGui
      .add(material.uniforms.uHoloStrength, "value")
      .min(0)
      .max(5)
      .step(0.01)
      .name("uHoloStrength");
    fragmentGui.addColor(materialParams, "color").onChange(() => {
      material.uniforms.uColor.value.set(materialParams.color);
    });

    // -----------------------------------------------------------------------
    // GUI — Vertex folder (original lines 128-133)
    // -----------------------------------------------------------------------
    const vertexGui = ctx.gui.addFolder("Vertex");
    vertexGui
      .add(material.uniforms.uGlitchStrength, "value")
      .min(0)
      .max(1)
      .step(0.01)
      .name("uGlitchStrength");

    // -----------------------------------------------------------------------
    // Torus knot (original: TorusKnotGeometry(0.6, 0.25, 128, 32), position.x = 3)
    // -----------------------------------------------------------------------
    const torusKnot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.6, 0.25, 128, 32),
      material
    );
    torusKnot.position.x = 3;
    ctx.scene.add(torusKnot);

    // -----------------------------------------------------------------------
    // Sphere (original: SphereGeometry(), position.x = -3)
    // -----------------------------------------------------------------------
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(), material);
    sphere.position.x = -3;
    ctx.scene.add(sphere);

    // -----------------------------------------------------------------------
    // Suzanne GLTF model (original: gltfLoader.load("./suzanne.glb", ...))
    // Apply holographic material to all mesh children
    // SMOKE GUARD: the fake loader returns an empty Group — guard so we don't
    // throw when no mesh children are present.
    // -----------------------------------------------------------------------
    ctx.loaders.gltf.load(modelUrl, (gltf) => {
      const suzanne = gltf.scene;
      if (suzanne) {
        suzanne.traverse((child) => {
          if (child.isMesh) child.material = material;
        });
        ctx.scene.add(suzanne);
      }
      // Store ref for update rotation (null if model loaded empty group)
      this._suzanne = suzanne && suzanne.children.length > 0 ? suzanne : null;
    });

    // Store refs for update / dispose
    this._material = material;
    this._torusKnot = torusKnot;
    this._sphere = sphere;
  },

  update(elapsed) {
    // Update time uniform (original: material.uniforms.uTime.value = elapsedTime)
    if (this._material) {
      this._material.uniforms.uTime.value = elapsed;
    }

    // Rotate objects (verbatim multipliers from original tick())
    // SMOKE GUARD: this._suzanne is null when the fake loader returned empty Group
    if (this._suzanne) {
      this._suzanne.rotation.x = -elapsed * 0.1;
      this._suzanne.rotation.y = elapsed * 0.2;
    }

    if (this._sphere) {
      this._sphere.rotation.x = -elapsed * 0.1;
      this._sphere.rotation.y = elapsed * 0.2;
    }

    if (this._torusKnot) {
      this._torusKnot.rotation.x = -elapsed * 0.1;
      this._torusKnot.rotation.y = elapsed * 0.2;
    }
  },

  dispose() {
    // Engine's disposeObject safety net handles geometry and materials
    // attached to the scene. Null our refs to release them.
    this._material = null;
    this._torusKnot = null;
    this._sphere = null;
    this._suzanne = null;
  },
};
