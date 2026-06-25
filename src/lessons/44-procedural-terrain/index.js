import * as THREE from "three";
import { Brush, Evaluator, SUBTRACTION } from "three-bvh-csg";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import cloudsFragmentShader from "./shaders/clouds/fragment.glsl";
import cloudsVertexShader from "./shaders/clouds/vertex.glsl";
import terrainFragmentShader from "./shaders/terrian/fragment.glsl";
import terrainVertexShader from "./shaders/terrian/vertex.glsl";

// Asset URL — resolved at build time via Vite's import.meta.url
const hdrUrl = new URL("./assets/spruit_sunrise.hdr", import.meta.url).href;

export default {
  name: "44 · Procedural Terrain",

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
    camera: {
      // Original: camera.position.set(-10, 6, -2); fov: 35; near: 0.1; far: 100
      position: [-10, 6, -2],
      fov: 35,
      near: 0.1,
      far: 100,
    },
  },

  init(ctx) {
    const { scene } = ctx;

    // ---- Background blurriness ----
    // Original line 35: scene.backgroundBlurriness = 0.5
    // The engine does NOT set this; its baseline reset does NOT clear it.
    // Set here and register cleanup so it doesn't leak into other scenes on switch.
    scene.backgroundBlurriness = 0.5;
    ctx.addCleanup(() => {
      scene.backgroundBlurriness = 0;
    });

    // ---- Debug object (color pickers) ----
    // Original lines 57-62
    const debugObject = {};
    debugObject.colorWaterDeep = "#002b3d";
    debugObject.colorWaterSurface = "#66a8ff";
    debugObject.colorSand = "#ffe894";
    debugObject.colorGrass = "#85d534";
    debugObject.colorSnow = "#ffffff";
    debugObject.colorRock = "#bfbd8d";

    // ---- Global uniforms (shared between terrain and clouds) ----
    // Original lines 42-45
    const globalUniforms = {
      uTime: new THREE.Uniform(0),
      uSpeed: new THREE.Uniform(0.2),
    };

    // ---- Terrain uniforms (spread global + terrain-specific) ----
    // Original lines 64-80
    const terrainUniforms = {
      ...globalUniforms,
      uPositionFrequency: new THREE.Uniform(0.2),
      uStrength: new THREE.Uniform(2.0),
      uWarpFrequency: new THREE.Uniform(5),
      uWarpStrength: new THREE.Uniform(0.5),
      uColorWaterDeep: new THREE.Uniform(
        new THREE.Color(debugObject.colorWaterDeep)
      ),
      uColorWaterSurface: new THREE.Uniform(
        new THREE.Color(debugObject.colorWaterSurface)
      ),
      uColorSand: new THREE.Uniform(new THREE.Color(debugObject.colorSand)),
      uColorGrass: new THREE.Uniform(new THREE.Color(debugObject.colorGrass)),
      uColorSnow: new THREE.Uniform(new THREE.Color(debugObject.colorSnow)),
      uColorRock: new THREE.Uniform(new THREE.Color(debugObject.colorRock)),
    };
    this._terrainUniforms = terrainUniforms;

    // ---- Terrain geometry ----
    // Original lines 51-54
    const terrainGeometry = new THREE.PlaneGeometry(10, 10, 500, 500);
    terrainGeometry.deleteAttribute("uv");
    terrainGeometry.deleteAttribute("normal");
    terrainGeometry.rotateX(-Math.PI * 0.5);
    this._terrainGeometry = terrainGeometry;

    // ---- Terrain material (CSM over MeshStandardMaterial) ----
    // Original lines 119-130 — NO silent prop
    const terrainMaterial = new CustomShaderMaterial({
      // CSM
      baseMaterial: THREE.MeshStandardMaterial,
      vertexShader: terrainVertexShader,
      fragmentShader: terrainFragmentShader,
      uniforms: terrainUniforms,

      // MeshStandardMaterial
      metalness: 0,
      roughness: 0.5,
      color: "#85D534",
    });
    this._terrainMaterial = terrainMaterial;

    // ---- Terrain depth material (CSM over MeshDepthMaterial) ----
    // Original lines 132-140 — NO silent prop
    const terrainDepthMaterial = new CustomShaderMaterial({
      // CSM
      baseMaterial: THREE.MeshDepthMaterial,
      vertexShader: terrainVertexShader,
      uniforms: terrainUniforms,

      // MeshDepthMaterial
      depthPacking: THREE.RGBADepthPacking,
    });
    this._terrainDepthMaterial = terrainDepthMaterial;

    // ---- Terrain mesh ----
    // Original lines 143-149
    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.customDepthMaterial = terrainDepthMaterial;
    terrain.receiveShadow = true;
    terrain.castShadow = true;
    scene.add(terrain);
    this._terrain = terrain;

    // ---- Water ----
    // Original lines 153-165
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10, 1, 1),
      new THREE.MeshPhysicalMaterial({
        transmission: 1,
        roughness: 0.3,
      })
    );
    water.rotation.x = -Math.PI * 0.5;
    water.position.y = -0.1;
    scene.add(water);
    this._water = water;

    // ---- Clouds uniforms (spread global uniforms) ----
    // Original lines 173-175
    const cloudsUniforms = {
      ...globalUniforms,
    };
    this._cloudsUniforms = cloudsUniforms;

    // ---- Clouds material (CSM over MeshBasicMaterial) ----
    // Original lines 177-186 — NO silent prop
    const cloudsMaterial = new CustomShaderMaterial({
      // CSM
      baseMaterial: THREE.MeshBasicMaterial,
      vertexShader: cloudsVertexShader,
      fragmentShader: cloudsFragmentShader,
      uniforms: cloudsUniforms,

      // MeshBasicMaterial
      transparent: true,
    });
    this._cloudsMaterial = cloudsMaterial;

    // ---- Clouds depth material (CSM over MeshDepthMaterial) ----
    // Original lines 187-196 — NO silent prop
    const cloudsDepthMaterial = new CustomShaderMaterial({
      // CSM
      baseMaterial: THREE.MeshDepthMaterial,
      vertexShader: cloudsVertexShader,
      fragmentShader: cloudsFragmentShader,
      uniforms: cloudsUniforms,

      // MeshDepthMaterial
      depthPacking: THREE.RGBADepthPacking,
    });
    this._cloudsDepthMaterial = cloudsDepthMaterial;

    // ---- Clouds geometry + mesh ----
    // Original lines 170-207
    const cloudsGeometry = new THREE.PlaneGeometry(10, 10, 1, 1);
    this._cloudsGeometry = cloudsGeometry;

    const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
    clouds.position.y = 1;
    clouds.rotation.x = -Math.PI * 0.5;
    clouds.customDepthMaterial = cloudsDepthMaterial;
    clouds.castShadow = true;
    clouds.receiveShadow = true;
    scene.add(clouds);
    this._clouds = clouds;

    // ---- CSG Board ----
    // Original lines 211-226: a box frame cut via three-bvh-csg SUBTRACTION
    const boardFill = new Brush(new THREE.BoxGeometry(11, 2, 11));
    const boardHole = new Brush(new THREE.BoxGeometry(10, 2.1, 10));
    this._boardFillGeometry = boardFill.geometry;
    this._boardHoleGeometry = boardHole.geometry;

    const evaluator = new Evaluator();
    const board = evaluator.evaluate(boardFill, boardHole, SUBTRACTION);

    board.geometry.clearGroups();
    board.material = new THREE.MeshStandardMaterial({
      color: "#ffffff",
    });
    board.castShadow = true;
    board.receiveShadow = true;
    scene.add(board);
    this._board = board;

    // ---- Directional light + shadow settings ----
    // Original lines 231-241
    const directionalLight = new THREE.DirectionalLight("#ffffff", 2);
    directionalLight.position.set(6.25, 3, 4);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(1024, 1024);
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 30;
    directionalLight.shadow.camera.top = 8;
    directionalLight.shadow.camera.right = 8;
    directionalLight.shadow.camera.bottom = -8;
    directionalLight.shadow.camera.left = -8;
    scene.add(directionalLight);
    this._directionalLight = directionalLight;

    // ---- GUI ----
    // Original lines 82-117
    ctx.gui.add(terrainUniforms.uSpeed, "value", 0, 1, 0.001).name("uSpeed");
    ctx.gui
      .add(terrainUniforms.uPositionFrequency, "value", 0, 1, 0.001)
      .name("uPositionFrequency");
    ctx.gui
      .add(terrainUniforms.uStrength, "value", 0, 10, 0.001)
      .name("uStrength");
    ctx.gui
      .add(terrainUniforms.uWarpFrequency, "value", 0, 10, 0.001)
      .name("uWarpFrequency");
    ctx.gui
      .add(terrainUniforms.uWarpStrength, "value", 0, 1, 0.001)
      .name("uWarpStrength");

    ctx.gui
      .addColor(debugObject, "colorWaterDeep")
      .onChange(() =>
        terrainUniforms.uColorWaterDeep.value.set(debugObject.colorWaterDeep)
      );
    ctx.gui
      .addColor(debugObject, "colorWaterSurface")
      .onChange(() =>
        terrainUniforms.uColorWaterSurface.value.set(
          debugObject.colorWaterSurface
        )
      );
    ctx.gui
      .addColor(debugObject, "colorSand")
      .onChange(() =>
        terrainUniforms.uColorSand.value.set(debugObject.colorSand)
      );
    ctx.gui
      .addColor(debugObject, "colorGrass")
      .onChange(() =>
        terrainUniforms.uColorGrass.value.set(debugObject.colorGrass)
      );
    ctx.gui
      .addColor(debugObject, "colorSnow")
      .onChange(() =>
        terrainUniforms.uColorSnow.value.set(debugObject.colorSnow)
      );
    ctx.gui
      .addColor(debugObject, "colorRock")
      .onChange(() =>
        terrainUniforms.uColorRock.value.set(debugObject.colorRock)
      );
  },

  update(elapsed) {
    // Original tick() body (line 310): update terrain uniforms with elapsed time
    // Use elapsed arg instead of clock.getElapsedTime()
    // terrainUniforms and cloudsUniforms share the same uTime + uSpeed references
    // from globalUniforms — updating one updates both.
    if (this._terrainUniforms) {
      this._terrainUniforms.uTime.value = elapsed;
    }
  },

  dispose() {
    // The engine's disposeObject handles materials, geometries, and lights attached
    // to the scene. However, the CSG Evaluator may leave detached brush geometries
    // that are not in the scene graph — dispose them explicitly.
    if (this._boardFillGeometry) {
      this._boardFillGeometry.dispose();
      this._boardFillGeometry = null;
    }
    if (this._boardHoleGeometry) {
      this._boardHoleGeometry.dispose();
      this._boardHoleGeometry = null;
    }

    // Null remaining refs to allow GC (engine handles the scene-attached objects).
    this._terrainUniforms = null;
    this._cloudsUniforms = null;
    this._terrainGeometry = null;
    this._terrainMaterial = null;
    this._terrainDepthMaterial = null;
    this._terrain = null;
    this._water = null;
    this._cloudsGeometry = null;
    this._cloudsMaterial = null;
    this._cloudsDepthMaterial = null;
    this._clouds = null;
    this._board = null;
    this._directionalLight = null;
  },
};
