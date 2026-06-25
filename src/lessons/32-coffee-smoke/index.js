import * as THREE from "three";
import smokeVertexShader from "./shaders/vertex.glsl";
import smokeFragmentShader from "./shaders/fragment.glsl";

// Asset URLs — resolved at build time via Vite's import.meta.url
const modelUrl = new URL("./assets/bakedModel.glb", import.meta.url).href;
const perlinUrl = new URL("./assets/perlin.png", import.meta.url).href;

export default {
  name: "32 · Coffee Smoke",

  config: {
    // Original: camera.position.x = 8, camera.position.y = 10, camera.position.z = 12
    // Original: fov = 25, near = 0.1, far = 100
    // Original: controls.target.y = 3
    camera: {
      position: [8, 10, 12],
      fov: 25,
      near: 0.1,
      far: 100,
    },
    // No explicit clearColor set in original — use engine default
    // No toneMapping / shadowMap set in original
  },

  init(ctx) {
    // -----------------------------------------------------------------------
    // OrbitControls target (original: controls.target.y = 3)
    // -----------------------------------------------------------------------
    if (ctx.controls) {
      ctx.controls.target.y = 3;
    }

    // -----------------------------------------------------------------------
    // Perlin noise texture (original: textureLoader.load with RepeatWrapping)
    // -----------------------------------------------------------------------
    const perlinTexture = ctx.loaders.texture.load(perlinUrl);
    perlinTexture.wrapS = THREE.RepeatWrapping;
    perlinTexture.wrapT = THREE.RepeatWrapping;

    // -----------------------------------------------------------------------
    // GLTF baked coffee model
    // -----------------------------------------------------------------------
    ctx.loaders.gltf.load(modelUrl, (gltf) => {
      // SMOKE GUARD: the headless smoke harness fake gltf loader returns an
      // empty Group (no children, no named objects). Guard so we don't throw
      // when the "baked" mesh is absent — the real asset has it in the browser.
      const baked = gltf.scene.getObjectByName("baked");
      if (baked) {
        baked.material.map.anisotropy = 8;
      }
      ctx.scene.add(gltf.scene);
    });

    // -----------------------------------------------------------------------
    // Smoke geometry (verbatim from original)
    // PlaneGeometry(1, 1, 16, 64) → translate(0, 0.5, 0) → scale(1.5, 6, 1.5)
    // -----------------------------------------------------------------------
    const smokeGeo = new THREE.PlaneGeometry(1, 1, 16, 64);
    smokeGeo.translate(0, 0.5, 0);
    smokeGeo.scale(1.5, 6, 1.5);

    // -----------------------------------------------------------------------
    // Smoke material (verbatim from original, with GUI uniforms)
    // -----------------------------------------------------------------------
    const smokeMat = new THREE.ShaderMaterial({
      vertexShader: smokeVertexShader,
      fragmentShader: smokeFragmentShader,
      uniforms: {
        uTime: new THREE.Uniform(0),
        uSmokeSpeed: new THREE.Uniform(0.03),
        uWindSpeed: new THREE.Uniform(0.01),
        uPerlinTexture: new THREE.Uniform(perlinTexture),
        uSmokeColor: new THREE.Uniform(new THREE.Color("#ffceb2")),
      },
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
    });

    // -----------------------------------------------------------------------
    // GUI — verbatim from original script.js
    // -----------------------------------------------------------------------
    ctx.gui
      .add(smokeMat.uniforms.uSmokeSpeed, "value")
      .min(0.01)
      .max(0.5)
      .step(0.001)
      .name("uSmokeSpeed");
    ctx.gui
      .add(smokeMat.uniforms.uWindSpeed, "value")
      .min(0.01)
      .max(0.5)
      .step(0.001)
      .name("uWindSpeed");
    ctx.gui
      .addColor(smokeMat.uniforms.uSmokeColor, "value")
      .onChange((value) => (smokeMat.uniforms.uSmokeColor.value = value));

    // -----------------------------------------------------------------------
    // Smoke mesh (original: smoke.position.y = 1.83)
    // -----------------------------------------------------------------------
    const smoke = new THREE.Mesh(smokeGeo, smokeMat);
    smoke.position.y = 1.83;
    ctx.scene.add(smoke);

    // Store refs for update / dispose
    this._smokeMat = smokeMat;
    this._smokeGeo = smokeGeo;
    this._perlinTexture = perlinTexture;
    this._smoke = smoke;
  },

  update(elapsed) {
    // Original: smokeMat.uniforms.uTime.value = elapsedTime
    if (this._smokeMat) {
      this._smokeMat.uniforms.uTime.value = elapsed;
    }
  },

  dispose() {
    // Engine's disposeObject safety net handles scene-attached geometry and
    // materials. Null our refs to release them.
    this._smokeMat = null;
    this._smokeGeo = null;
    this._perlinTexture = null;
    this._smoke = null;
  },
};
