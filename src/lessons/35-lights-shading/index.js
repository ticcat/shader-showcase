import * as THREE from "three";
import shadingVertexShader from "./shaders/shading/vertex.glsl";
import shadingFragmentShader from "./shaders/shading/fragment.glsl";

// Asset URL — resolved at build time via Vite's import.meta.url
const modelUrl = new URL("./assets/suzanne.glb", import.meta.url).href;

export default {
  name: "35 · Lights Shading",

  config: {
    // Original: camera.position.x = 7; camera.position.y = 7; camera.position.z = 7; fov = 25, near = 0.1, far = 100
    camera: {
      position: [7, 7, 7],
      fov: 25,
      near: 0.1,
      far: 100,
    },
    // Original: renderer.toneMapping = ACESFilmic is COMMENTED OUT (lines 73-74) — leave tone mapping OFF
    // No clearColor set in original — use engine default
  },

  init(ctx) {
    // -----------------------------------------------------------------------
    // Material parameters (original line 82-83: materialParameters.color = "#ffffff")
    // -----------------------------------------------------------------------
    const materialParameters = {};
    materialParameters.color = "#ffffff";

    // -----------------------------------------------------------------------
    // Custom-lighting ShaderMaterial (original lines 84-95)
    // Uniforms: uTime, uColor
    // -----------------------------------------------------------------------
    const material = new THREE.ShaderMaterial({
      vertexShader: shadingVertexShader,
      fragmentShader: shadingFragmentShader,
      uniforms: {
        uTime: new THREE.Uniform(0),
        uColor: new THREE.Uniform(new THREE.Color(materialParameters.color)),
      },
    });

    // -----------------------------------------------------------------------
    // GUI — color control only (original lines 93-95)
    // gui.addColor(materialParameters, "color").onChange(...)
    // -----------------------------------------------------------------------
    ctx.gui.addColor(materialParameters, "color").onChange(() => {
      material.uniforms.uColor.value.set(materialParameters.color);
    });

    // -----------------------------------------------------------------------
    // Torus knot (original lines 101-106: TorusKnotGeometry(0.6, 0.25, 128, 32), position.x = 3)
    // -----------------------------------------------------------------------
    const torusKnot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.6, 0.25, 128, 32),
      material
    );
    torusKnot.position.x = 3;
    ctx.scene.add(torusKnot);

    // -----------------------------------------------------------------------
    // Sphere (original lines 108-110: SphereGeometry(), position.x = -3)
    // -----------------------------------------------------------------------
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(), material);
    sphere.position.x = -3;
    ctx.scene.add(sphere);

    // -----------------------------------------------------------------------
    // Suzanne GLTF model (original lines 113-121)
    // Apply shading material to all mesh children.
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

    // -----------------------------------------------------------------------
    // Light helpers (original lines 126-148)
    // directionalLightHelper: PlaneGeometry, blue, DoubleSide, position (0, 0, 3)
    // pointLightHelper: IcosahedronGeometry(0.1, 2), red, position (0, 2.5, 0)
    // pointLightHelper2: IcosahedronGeometry(0.1, 2), green, position (0, -2.5, 0)
    // -----------------------------------------------------------------------
    const directionalLightHelper = new THREE.Mesh(
      new THREE.PlaneGeometry(),
      new THREE.MeshBasicMaterial()
    );
    directionalLightHelper.material.color.setRGB(0.1, 0.1, 1.0);
    directionalLightHelper.material.side = THREE.DoubleSide;
    directionalLightHelper.position.set(0, 0, 3);

    const pointLightHelper = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.1, 2),
      new THREE.MeshBasicMaterial()
    );
    pointLightHelper.material.color.setRGB(1, 0.1, 0.1);
    pointLightHelper.position.set(0, 2.5, 0);

    const pointLightHelper2 = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.1, 2),
      new THREE.MeshBasicMaterial()
    );
    pointLightHelper2.material.color.setRGB(0.1, 1.0, 0.5);
    pointLightHelper2.position.set(0, -2.5, 0);

    ctx.scene.add(directionalLightHelper, pointLightHelper, pointLightHelper2);

    // Store refs for update / dispose
    this._material = material;
    this._torusKnot = torusKnot;
    this._sphere = sphere;
    this._pointLightHelper = pointLightHelper;
    this._pointLightHelper2 = pointLightHelper2;
  },

  update(elapsed) {
    // Update time uniform (original: material.uniforms.uTime.value = elapsedTime)
    if (this._material) {
      this._material.uniforms.uTime.value = elapsed;
    }

    // Rotate objects (verbatim multipliers from original tick(), lines 162-171)
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

    // Animate light helpers (original lines 173-184)
    if (this._pointLightHelper) {
      this._pointLightHelper.position.set(
        Math.sin(elapsed) * 3,
        2.5,
        Math.cos(elapsed) * 3
      );
    }

    if (this._pointLightHelper2) {
      this._pointLightHelper2.position.set(
        Math.sin(-elapsed),
        -2.5,
        Math.cos(-elapsed)
      );
    }
  },

  dispose() {
    // Engine's disposeObject safety net handles geometry and materials
    // attached to the scene. Null our refs to release them.
    this._material = null;
    this._torusKnot = null;
    this._sphere = null;
    this._suzanne = null;
    this._pointLightHelper = null;
    this._pointLightHelper2 = null;
  },
};
