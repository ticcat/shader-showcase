import * as THREE from "three";
import halftoneVertexShader from "./shaders/halftone/vertex.glsl";
import halftoneFragmentShader from "./shaders/halftone/fragment.glsl";

// Asset URL — resolved at build time via Vite's import.meta.url
const modelUrl = new URL("./assets/suzanne.glb", import.meta.url).href;

export default {
  name: "37 · Halftone Shading",

  config: {
    // Original: rendererParameters.clearColor = "#26132f"
    clearColor: "#26132f",
    // Original: camera.position.x = 7; camera.position.y = 7; camera.position.z = 7; fov = 25, near = 0.1, far = 100
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
    // Clear-color GUI (original lines 86-88:
    //   gui.addColor(rendererParameters, "clearColor").onChange(() => {
    //     renderer.setClearColor(rendererParameters.clearColor);
    //   });
    // Reproduced via a local rendererParameters object wired to ctx.renderer
    // -----------------------------------------------------------------------
    const rendererParameters = { clearColor: "#26132f" };
    ctx.gui.addColor(rendererParameters, "clearColor").onChange(() => {
      ctx.renderer.setClearColor(rendererParameters.clearColor);
    });

    // -----------------------------------------------------------------------
    // Material parameters (original lines 93-98)
    // Note: materialParameters.shadeColor is undefined in the original —
    // uShadeColor uniform is initialized with new THREE.Color(undefined),
    // which produces a default black color. Replicated verbatim.
    // -----------------------------------------------------------------------
    const materialParameters = {};
    materialParameters.color = "#ff794d";
    materialParameters.shadowColor = "#8e19b8";
    materialParameters.lightColor = "#e5ffe0";
    materialParameters.shadowRepetitions = 100.0;
    materialParameters.lightRepetitions = 130.0;

    // -----------------------------------------------------------------------
    // Halftone ShaderMaterial (original lines 100-123)
    // uResolution must be set from ctx.sizes (replaces original sizes object)
    // -----------------------------------------------------------------------
    const material = new THREE.ShaderMaterial({
      vertexShader: halftoneVertexShader,
      fragmentShader: halftoneFragmentShader,
      uniforms: {
        uColor: new THREE.Uniform(new THREE.Color(materialParameters.color)),
        uShadeColor: new THREE.Uniform(
          new THREE.Color(materialParameters.shadeColor)
        ),
        uResolution: new THREE.Uniform(
          new THREE.Vector2(
            ctx.sizes.width * ctx.sizes.pixelRatio,
            ctx.sizes.height * ctx.sizes.pixelRatio
          )
        ),
        uShadowColor: new THREE.Uniform(
          new THREE.Color(materialParameters.shadowColor)
        ),
        uLightColor: new THREE.Uniform(
          new THREE.Color(materialParameters.lightColor)
        ),
        uShadowRepetitions: new THREE.Uniform(materialParameters.shadowRepetitions),
        uLightRepetitions: new THREE.Uniform(materialParameters.lightRepetitions),
      },
    });

    // -----------------------------------------------------------------------
    // GUI — color and repetition controls (original lines 125-145)
    // -----------------------------------------------------------------------
    ctx.gui.addColor(materialParameters, "color").onChange(() => {
      material.uniforms.uColor.value.set(materialParameters.color);
    });
    ctx.gui.addColor(materialParameters, "shadowColor").onChange(() => {
      material.uniforms.uShadowColor.value.set(materialParameters.shadowColor);
    });
    ctx.gui.addColor(materialParameters, "lightColor").onChange(() => {
      material.uniforms.uLightColor.value.set(materialParameters.lightColor);
    });
    ctx.gui
      .add(material.uniforms.uShadowRepetitions, "value")
      .min(1)
      .max(300)
      .step(1)
      .name("uShadowRepetitions");
    ctx.gui
      .add(material.uniforms.uLightRepetitions, "value")
      .min(1)
      .max(300)
      .step(1)
      .name("uLightRepetitions");

    // -----------------------------------------------------------------------
    // Torus knot (original lines 151-156:
    //   new THREE.TorusKnotGeometry(0.6, 0.25, 128, 32), position.x = 3)
    // -----------------------------------------------------------------------
    const torusKnot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.6, 0.25, 128, 32),
      material
    );
    torusKnot.position.x = 3;
    ctx.scene.add(torusKnot);

    // -----------------------------------------------------------------------
    // Sphere (original lines 159-161: SphereGeometry(), position.x = -3)
    // -----------------------------------------------------------------------
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(), material);
    sphere.position.x = -3;
    ctx.scene.add(sphere);

    // -----------------------------------------------------------------------
    // Suzanne GLTF model (original lines 164-171)
    // Apply halftone material to all mesh children.
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
      // Store ref for update rotation (null if model loaded empty group with no children)
      this._suzanne = suzanne && suzanne.children.length > 0 ? suzanne : null;
    });

    // Store refs for update / dispose / onResize
    this._material = material;
    this._torusKnot = torusKnot;
    this._sphere = sphere;
  },

  onResize(sizes) {
    // Original resize handler (lines 38-43) updates the uResolution uniform
    // when the window is resized. Engine handles camera/renderer resize.
    if (this._material) {
      this._material.uniforms.uResolution.value.set(
        sizes.width * sizes.pixelRatio,
        sizes.height * sizes.pixelRatio
      );
    }
  },

  update(elapsed) {
    // No uTime uniform in this material (no time-based animation in original)

    // Rotate objects (verbatim multipliers from original tick(), lines 182-191)
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
