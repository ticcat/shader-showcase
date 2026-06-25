import * as THREE from "three";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import wobbleVertexShader from "./shaders/wobble/vertex.glsl";
import wobbleFragmentShader from "./shaders/wobble/fragment.glsl";

// Asset URLs — resolved at build time via Vite's import.meta.url
const hdrUrl = new URL("./assets/urban_alley_01_1k.hdr", import.meta.url).href;
const modelUrl = new URL("./assets/suzanne.glb", import.meta.url).href;

export default {
  name: "42 · Wobbly Sphere",

  config: {
    // Original: renderer.shadowMap.type = THREE.PCFSoftShadowMap
    shadowMap: "PCFSoft",
    // Original: renderer.toneMapping = THREE.ACESFilmicToneMapping
    toneMapping: "ACESFilmic",
    // Original: renderer.toneMappingExposure = 1
    toneMappingExposure: 1,
    // Engine loads this HDR via ctx.loaders.rgbe and sets scene.environment + scene.background
    // (original: scene.background = environmentMap; scene.environment = environmentMap)
    environment: hdrUrl,
    // config.background NOT set to false — engine sets background = env (same as original)
    camera: {
      // Original: camera.position.set(13, -3, -5); fov: 35; near: 0.1; far: 100
      position: [13, -3, -5],
      fov: 35,
      near: 0.1,
      far: 100,
    },
  },

  init(ctx) {
    const { scene } = ctx;

    // ---- Shared debug object (for GUI color pickers) ----
    const debugObject = {};
    debugObject.colorA = "#0000ff";
    debugObject.colorB = "#ff0000";

    // ---- Shared uniforms (drive BOTH main material and depth material) ----
    // Original lines 62-72: single uniforms object shared by material + depthMaterial
    const uniforms = {
      uTime: new THREE.Uniform(0),
      uPositionFrequency: new THREE.Uniform(0.5),
      uTimeFrequency: new THREE.Uniform(0.4),
      uStrength: new THREE.Uniform(0.3),
      uWarpPositionFrequency: new THREE.Uniform(0.38),
      uWarpTimeFrequency: new THREE.Uniform(0.12),
      uWarpStrength: new THREE.Uniform(1.7),
      uColorA: new THREE.Uniform(new THREE.Color(debugObject.colorA)),
      uColorB: new THREE.Uniform(new THREE.Color(debugObject.colorB)),
    };
    this._uniforms = uniforms;

    // ---- Main material: CustomShaderMaterial wrapping MeshPhysicalMaterial ----
    // Original lines 74-90
    const material = new CustomShaderMaterial({
      // CSM
      baseMaterial: THREE.MeshPhysicalMaterial,
      vertexShader: wobbleVertexShader,
      fragmentShader: wobbleFragmentShader,
      uniforms: uniforms,

      // MeshPhysicalMaterial props (verbatim from original)
      metalness: 0,
      roughness: 0.5,
      color: "#ffffff",
      transmission: 0,
      ior: 1.5,
      thickness: 1.5,
      transparent: true,
      wireframe: false,
    });
    this._material = material;

    // ---- Depth material: CustomShaderMaterial wrapping MeshDepthMaterial ----
    // Shares the SAME uniforms object so uTime updates drive both materials
    // Original lines 92-100
    const depthMaterial = new CustomShaderMaterial({
      // CSM
      baseMaterial: THREE.MeshDepthMaterial,
      vertexShader: wobbleVertexShader,
      uniforms: uniforms,

      // MeshDepthMaterial props (verbatim from original)
      depthPacking: THREE.RGBADepthPacking,
    });
    this._depthMaterial = depthMaterial;

    // ---- Load suzanne.glb model ----
    // Original lines 34-43: gltfLoader.load("./suzanne.glb", (gltf) => { ... })
    // Note: geometry section (IcosahedronGeometry + mergeVertices + computeTangents)
    // is COMMENTED OUT in the original (lines 135-145) — NOT used; model is used instead.
    ctx.loaders.gltf.load(modelUrl, (gltf) => {
      // SMOKE GUARD: fake loader returns an empty Group with no children.
      // The real asset provides suzanne as gltf.scene.children[0].
      if (!gltf.scene.children.length) return;

      const wobble = gltf.scene.children[0];

      wobble.receiveShadow = true;
      wobble.castShadow = true;
      wobble.material = material;
      wobble.customDepthMaterial = depthMaterial;

      scene.add(wobble);
      this._wobble = wobble;
    });

    // ---- Plane (floor) ----
    // Original lines 150-158
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(15, 15, 15),
      new THREE.MeshStandardMaterial()
    );
    plane.receiveShadow = true;
    plane.rotation.y = Math.PI;
    plane.position.y = -5;
    plane.position.z = 5;
    scene.add(plane);
    this._plane = plane;

    // ---- Directional light + shadow settings ----
    // Original lines 163-169
    const directionalLight = new THREE.DirectionalLight("#ffffff", 3);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(1024, 1024);
    directionalLight.shadow.camera.far = 15;
    directionalLight.shadow.normalBias = 0.05;
    directionalLight.position.set(0.25, 2, -2.25);
    scene.add(directionalLight);
    this._directionalLight = directionalLight;

    // ---- GUI ----
    // Material folder — original lines 103-115
    const matGui = ctx.gui.addFolder("Material");
    matGui.add(material, "metalness", 0, 1, 0.001);
    matGui.add(material, "roughness", 0, 1, 0.001);
    matGui.add(material, "transmission", 0, 1, 0.001);
    matGui.add(material, "ior", 0, 10, 0.001);
    matGui.add(material, "thickness", 0, 10, 0.001);
    matGui.addColor(material, "color");
    matGui.addColor(debugObject, "colorA").onChange(() => {
      uniforms.uColorA.value.set(debugObject.colorA);
    });
    matGui.addColor(debugObject, "colorB").onChange(() => {
      uniforms.uColorB.value.set(debugObject.colorB);
    });

    // Wobble effect folder — original lines 117-133
    const wobbleGui = ctx.gui.addFolder("Wobble effect");
    wobbleGui
      .add(uniforms.uPositionFrequency, "value", 0, 2, 0.001)
      .name("uPositionFrequency");
    wobbleGui
      .add(uniforms.uTimeFrequency, "value", 0, 2, 0.001)
      .name("uTimeFrequency");
    wobbleGui.add(uniforms.uStrength, "value", 0, 2, 0.001).name("uStrength");
    wobbleGui
      .add(uniforms.uWarpPositionFrequency, "value", 0, 2, 0.001)
      .name("uWarpPositionFrequency");
    wobbleGui
      .add(uniforms.uWarpTimeFrequency, "value", 0, 2, 0.001)
      .name("uWarpTimeFrequency");
    wobbleGui
      .add(uniforms.uWarpStrength, "value", 0, 2, 0.001)
      .name("uWarpStrength");
  },

  update(elapsed) {
    // Original tick() body (lines 235): uniforms.uTime.value = elapsedTime
    // The shared uniforms object drives both main material and depth material simultaneously.
    this._uniforms.uTime.value = elapsed;
  },

  dispose() {
    // Materials and geometry on the scene are cleaned up by the engine's disposeObject.
    // Null refs to allow GC.
    this._uniforms = null;
    this._material = null;
    this._depthMaterial = null;
    this._wobble = null;
    this._plane = null;
    this._directionalLight = null;
  },
};
