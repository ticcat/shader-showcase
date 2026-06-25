import * as THREE from "three";

// Asset URLs — resolved at build time via Vite's import.meta.url
const colorUrl = new URL("./assets/color.jpg", import.meta.url).href;
const normalUrl = new URL("./assets/normal.jpg", import.meta.url).href;
const modelUrl = new URL("./assets/LeePerrySmith.glb", import.meta.url).href;

const envPx = new URL("./assets/environmentMaps/0/px.jpg", import.meta.url).href;
const envNx = new URL("./assets/environmentMaps/0/nx.jpg", import.meta.url).href;
const envPy = new URL("./assets/environmentMaps/0/py.jpg", import.meta.url).href;
const envNy = new URL("./assets/environmentMaps/0/ny.jpg", import.meta.url).href;
const envPz = new URL("./assets/environmentMaps/0/pz.jpg", import.meta.url).href;
const envNz = new URL("./assets/environmentMaps/0/nz.jpg", import.meta.url).href;

export default {
  name: "31 · Modified Materials",

  config: {
    // Original: renderer.shadowMap.type = THREE.PCFShadowMap
    shadowMap: "PCF",
    // Original: renderer.toneMapping = THREE.ACESFilmicToneMapping
    toneMapping: "ACESFilmic",
    // Original: renderer.toneMappingExposure = 1
    toneMappingExposure: 1,
    camera: {
      position: [4, 1, -4],
      fov: 75,
      near: 0.1,
      far: 100,
    },
    // NOTE: no config.environment — this lesson uses a cube-texture env map (not HDR).
    // The cube map is loaded manually in init() and cleaned up via addCleanup().
  },

  init(ctx) {
    // -----------------------------------------------------------------------
    // Custom uniforms — shared between the main material and the depth material
    // (verbatim from original script.js)
    // -----------------------------------------------------------------------
    const customUniforms = {
      uTime: { value: 0 },
      uMousePos: { value: new THREE.Vector2() },
      uSpeed: { value: 5 },
    };

    // -----------------------------------------------------------------------
    // Cube-texture environment map (NOT HDR — cube loader, not rgbe)
    // -----------------------------------------------------------------------
    ctx.loaders.cube.load(
      [envPx, envNx, envPy, envNy, envPz, envNz],
      (env) => {
        ctx.scene.background = env;
        ctx.scene.environment = env;

        // Register teardown so switching scenes releases the cube texture
        ctx.addCleanup(() => {
          ctx.scene.background = null;
          ctx.scene.environment = null;
          env.dispose();
        });
      }
    );

    // -----------------------------------------------------------------------
    // Textures
    // -----------------------------------------------------------------------
    const mapTexture = ctx.loaders.texture.load(colorUrl);
    mapTexture.colorSpace = THREE.SRGBColorSpace;
    const normalTexture = ctx.loaders.texture.load(normalUrl);

    // -----------------------------------------------------------------------
    // Material with onBeforeCompile (verbatim chunk replacements from original)
    // -----------------------------------------------------------------------
    const material = new THREE.MeshStandardMaterial({
      map: mapTexture,
      normalMap: normalTexture,
    });

    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = customUniforms.uTime;
      shader.uniforms.uMousePos = customUniforms.uMousePos;
      shader.uniforms.uSpeed = customUniforms.uSpeed;

      shader.vertexShader = shader.vertexShader.replace(
        "#include <common>",
        `
      #include <common>

      uniform float uTime;
      uniform vec2 uMousePos;
      uniform float uSpeed;

      mat2 get2dRotateMatrix(float _angle)
      {
        return mat2(cos(_angle), - sin(_angle), sin(_angle), cos(_angle));
      }
    `
      );

      shader.vertexShader = shader.vertexShader.replace(
        "#include <beginnormal_vertex>",
        `
      #include <beginnormal_vertex>

      float angle = (sin(position.y + uTime * uMousePos.x * uSpeed)) * 0.4;;
      mat2 rotateMatrix = get2dRotateMatrix(angle);

      objectNormal.xz = rotateMatrix * objectNormal.xz;
    `
      );

      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `
      #include <begin_vertex>

      transformed.xz = rotateMatrix * transformed.xz;
    `
      );
    };

    // -----------------------------------------------------------------------
    // Depth material — mirrors the main onBeforeCompile for correct shadows
    // (verbatim from original script.js)
    // -----------------------------------------------------------------------
    const depthMaterial = new THREE.MeshDepthMaterial(THREE.RGBADepthPacking);

    depthMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = customUniforms.uTime;
      shader.uniforms.uMousePos = customUniforms.uMousePos;

      shader.vertexShader = shader.vertexShader.replace(
        "#include <common>",
        `
      #include <common>

      uniform float uTime;
      uniform vec2 uMousePos;
      uniform float uSpeed;

      mat2 get2dRotateMatrix(float _angle)
      {
        return mat2(cos(_angle), - sin(_angle), sin(_angle), cos(_angle));
      }
    `
      );

      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `
      #include <begin_vertex>

      float angle = (sin(position.y + uTime * uMousePos.x * uSpeed)) * 0.4;
      mat2 rotateMatrix = get2dRotateMatrix(angle);

      transformed.xz = rotateMatrix * transformed.xz;
    `
      );
    };

    // -----------------------------------------------------------------------
    // GLTF model
    // -----------------------------------------------------------------------
    ctx.loaders.gltf.load(modelUrl, (gltf) => {
      // SMOKE GUARD: under the headless smoke harness the fake gltf loader
      // returns an empty Group with no children. Guard here so nothing throws
      // when there is no mesh to configure.
      const mesh = gltf.scene.children[0];
      if (!mesh) return; // no-op in headless/smoke runs; real asset has the mesh

      mesh.rotation.y = Math.PI * 0.5;
      mesh.material = material;
      mesh.customDepthMaterial = depthMaterial;
      ctx.scene.add(mesh);

      // updateAllMaterials — traverse and enable env-map + shadows on every
      // MeshStandardMaterial in the loaded scene (verbatim from original)
      ctx.scene.traverse((child) => {
        if (
          child instanceof THREE.Mesh &&
          child.material instanceof THREE.MeshStandardMaterial
        ) {
          child.material.envMapIntensity = 1;
          child.material.needsUpdate = true;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    });

    // -----------------------------------------------------------------------
    // Directional light with shadow (verbatim from original)
    // -----------------------------------------------------------------------
    const directionalLight = new THREE.DirectionalLight("#ffffff", 3);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(1024, 1024);
    directionalLight.shadow.camera.far = 15;
    directionalLight.shadow.normalBias = 0.05;
    directionalLight.position.set(0.25, 2, -2.25);
    ctx.scene.add(directionalLight);

    // -----------------------------------------------------------------------
    // Mouse-move listener — updates uMousePos so the twist responds to cursor
    // -----------------------------------------------------------------------
    ctx.registerEventListener(window, "mousemove", (event) => {
      customUniforms.uMousePos.value = new THREE.Vector2(
        event.clientX / window.innerWidth,
        1 - event.clientY / window.innerHeight
      );
    });

    // Store refs for update / dispose
    this._customUniforms = customUniforms;
    this._material = material;
    this._depthMaterial = depthMaterial;
    this._directionalLight = directionalLight;
    this._mapTexture = mapTexture;
    this._normalTexture = normalTexture;
  },

  update(elapsed) {
    // Original: customUniforms.uTime.value = elapsedTime
    if (this._customUniforms) {
      this._customUniforms.uTime.value = elapsed;
    }
  },

  dispose() {
    // The engine's disposeObject safety net handles geometry, materials, and
    // scene-attached textures. We only need to null our refs here.
    // The cube env teardown is handled by the addCleanup registered in init().
    this._customUniforms = null;
    this._material = null;
    this._depthMaterial = null;
    this._directionalLight = null;
    this._mapTexture = null;
    this._normalTexture = null;
  },
};
