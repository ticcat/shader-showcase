import gsap from "gsap";
import * as THREE from "three";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import sliceFragmentShader from "./shaders/fragment.glsl";
import sliceVertexShader from "./shaders/vertex.glsl";

// Asset URLs — resolved at build time via Vite's import.meta.url
const hdrUrl = new URL("./assets/aerodynamics_workshop.hdr", import.meta.url).href;
const modelUrl = new URL("./assets/gears.glb", import.meta.url).href;

export default {
  name: "43 · Sliced Model",

  config: {
    // Original: renderer.shadowMap.type = THREE.PCFSoftShadowMap
    shadowMap: "PCFSoft",
    // Original: renderer.toneMapping = THREE.ACESFilmicToneMapping
    toneMapping: "ACESFilmic",
    // Original: renderer.toneMappingExposure = 1
    toneMappingExposure: 1,
    // Engine loads this HDR via ctx.loaders.rgbe and sets scene.environment + scene.background
    // (original lines 35-41: scene.background = environmentMap; scene.environment = environmentMap)
    environment: hdrUrl,
    // config.background NOT set to false — engine sets background = env (same as original)
    camera: {
      // Original: camera.position.set(-5, 5, 12); fov: 35; near: 0.1; far: 100
      position: [-5, 5, 12],
      fov: 35,
      near: 0.1,
      far: 100,
    },
  },

  init(ctx) {
    const { scene } = ctx;

    // ---- Background blurriness ----
    // Original line 39: scene.backgroundBlurriness = 0.5
    // The engine does NOT set this; its baseline reset does NOT clear it.
    // Set here and register cleanup so it doesn't leak into other scenes on switch.
    scene.backgroundBlurriness = 0.5;
    ctx.addCleanup(() => {
      scene.backgroundBlurriness = 0;
    });

    // ---- Shared uniforms (drive both slicedMaterial and slicedDepthMaterial) ----
    // Original lines 71-74
    const uniforms = {
      uSliceStart: new THREE.Uniform(1.75),
      uSliceArc: new THREE.Uniform(0),
    };
    this._uniforms = uniforms;

    // ---- patchMap ----
    // Original lines 84-93
    const patchMap = {
      csm_Slice: {
        "#include <colorspace_fragment>": `
      #include <colorspace_fragment>

      if(!gl_FrontFacing)
        gl_FragColor = vec4(0.75, 0.15, 0.3, 1.0);
    `,
      },
    };

    // ---- baseMaterial: CSM wrapping MeshStandardMaterial (no shaders) ----
    // Original lines 95-104 — NO silent prop
    const baseMaterial = new CustomShaderMaterial({
      // CSM
      baseMaterial: THREE.MeshStandardMaterial,

      // MeshStandardMaterial
      metalness: 0.5,
      roughness: 0.25,
      envMapIntensity: 0.5,
      color: "#858080",
    });
    this._baseMaterial = baseMaterial;

    // ---- slicedMaterial: CSM wrapping MeshStandardMaterial with slice shaders ----
    // Original lines 106-120 — NO silent prop
    const slicedMaterial = new CustomShaderMaterial({
      // CSM
      baseMaterial: THREE.MeshStandardMaterial,
      vertexShader: sliceVertexShader,
      fragmentShader: sliceFragmentShader,
      uniforms: uniforms,
      patchMap: patchMap,

      // MeshStandardMaterial
      metalness: 0.5,
      roughness: 0.25,
      envMapIntensity: 0.5,
      color: "#858080",
      side: THREE.DoubleSide,
    });
    this._slicedMaterial = slicedMaterial;

    // ---- slicedDepthMaterial: CSM wrapping MeshDepthMaterial with slice shaders ----
    // Original lines 122-132 — NO silent prop
    const slicedDepthMaterial = new CustomShaderMaterial({
      // CSM
      baseMaterial: THREE.MeshDepthMaterial,
      vertexShader: sliceVertexShader,
      fragmentShader: sliceFragmentShader,
      uniforms: uniforms,
      patchMap: patchMap,

      // MeshDepthMaterial
      depthPacking: THREE.RGBADepthPacking,
    });
    this._slicedDepthMaterial = slicedDepthMaterial;

    // ---- Load gears.glb model ----
    // Original lines 48-65
    ctx.loaders.gltf.load(modelUrl, (gltf) => {
      // SMOKE GUARD: fake loader returns an empty Group with no children.
      // The real asset provides the gears model as gltf.scene.
      if (!gltf.scene.children.length) return;

      const model = gltf.scene;

      model.traverse((child) => {
        if (child.isMesh) {
          if (child.name === "outerHull") {
            child.material = slicedMaterial;
            child.customDepthMaterial = slicedDepthMaterial;
          } else {
            child.material = baseMaterial;
          }
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      scene.add(model);
      this._model = model;
    });

    // ---- Plane ----
    // Original lines 141-150
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10, 10),
      new THREE.MeshStandardMaterial({ color: "#aaaaaa" })
    );
    plane.receiveShadow = true;
    plane.position.x = -4;
    plane.position.y = -3;
    plane.position.z = -4;
    plane.lookAt(new THREE.Vector3(0, 0, 0));
    scene.add(plane);
    this._plane = plane;

    // ---- Directional light + shadow settings ----
    // Original lines 155-166
    const directionalLight = new THREE.DirectionalLight("#ffffff", 4);
    directionalLight.position.set(6.25, 3, 4);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(1024, 1024);
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 30;
    directionalLight.shadow.normalBias = 0.05;
    directionalLight.shadow.camera.top = 8;
    directionalLight.shadow.camera.right = 8;
    directionalLight.shadow.camera.bottom = -8;
    directionalLight.shadow.camera.left = -8;
    scene.add(directionalLight);
    this._directionalLight = directionalLight;

    // ---- gsap timeline: animate uSliceArc ----
    // Original lines 227-230
    const tl = gsap.timeline();
    tl.to(uniforms.uSliceArc, { duration: 2, value: 1.25 }, "+=1")
      .to(uniforms.uSliceArc, { duration: 1, value: 0 }, "+=3")
      .repeat(-1);
    this._tl = tl;

    // Kill tweens on scene switch so they don't leak
    ctx.addCleanup(() => {
      gsap.killTweensOf(uniforms.uSliceArc);
      if (tl) tl.kill();
    });

    // ---- GUI ----
    // Original lines 76-82
    ctx.gui
      .add(uniforms.uSliceStart, "value", -Math.PI, Math.PI, 0.001)
      .name("uSliceStart");
    ctx.gui
      .add(uniforms.uSliceArc, "value", 0, Math.PI * 2, 0.001)
      .name("uSliceArc")
      .listen();
  },

  update(elapsed) {
    // Original tick() body (line 241): rotate model by elapsedTime
    // Use elapsed arg instead of clock.getElapsedTime()
    if (this._model) {
      this._model.rotation.y = elapsed * 0.1;
    }
  },

  dispose() {
    // Materials, geometry, and lights are cleaned up by the engine's disposeObject.
    // Null refs to allow GC.
    this._uniforms = null;
    this._baseMaterial = null;
    this._slicedMaterial = null;
    this._slicedDepthMaterial = null;
    this._model = null;
    this._plane = null;
    this._directionalLight = null;
    this._tl = null;
  },
};
