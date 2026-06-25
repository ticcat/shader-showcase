import * as THREE from "three";
// Import directly from the specific module path — avoids the barrel Addons.js import which
// triggers canvas-context code in sibling exports (e.g. AsciiEffect) that fail in jsdom.
import { GPUComputationRenderer } from "three/examples/jsm/misc/GPUComputationRenderer.js";
import gpgpuParticlesShader from "./shaders/gpgpu/particles.glsl";
import particlesFragmentShader from "./shaders/particles/fragment.glsl";
import particlesVertexShader from "./shaders/particles/vertex.glsl";

// Asset URL — resolved at build time via Vite's import.meta.url
const modelUrl = new URL("./assets/model.glb", import.meta.url).href;

export default {
  name: "41 · GPGPU Flow Field",

  config: {
    // Original: debugObject.clearColor = "#29191f"; renderer.setClearColor(debugObject.clearColor)
    clearColor: "#29191f",
    // Original: camera.position.set(4.5, 4, 11)
    camera: {
      position: [4.5, 4, 11],
    },
  },

  async init(ctx) {
    const { scene, renderer, sizes } = ctx;

    const debugObject = {};
    debugObject.clearColor = "#29191f";

    // Load DRACO-compressed GLTF model.
    // ctx.loaders.gltf already has DRACOLoader configured at /draco/ — do NOT create a new one.
    const gltf = await ctx.loaders.gltf.loadAsync(modelUrl);

    // PRIMARY SMOKE GUARD (CRITICAL): under the smoke harness, the fake loader returns an
    // empty Group with no children. The GPUComputationRenderer requires a real WebGL2 context
    // AND the model's geometry (to build the base particles texture) — both are absent headless.
    // We bail early here so the entire gpgpu build is skipped in the smoke test.
    // In the real browser, the model has at least one child mesh with geometry, so the full
    // path runs normally.
    const baseMesh = gltf.scene.children[0];
    if (!baseMesh) return;

    /**
     * Base geometry
     */
    const baseGeometry = {};
    baseGeometry.instance = baseMesh.geometry;
    baseGeometry.count = baseGeometry.instance.attributes.position.count;

    /**
     * GPU Compute
     */
    // Setup
    const size = Math.ceil(Math.sqrt(baseGeometry.count));
    // Pass ctx.renderer (the real WebGLRenderer) to GPUComputationRenderer
    const computation = new GPUComputationRenderer(size, size, renderer);

    // Base particles texture — fill each texel with a particle's base position
    const baseParticlesTexture = computation.createTexture();

    for (let i = 0; i < baseGeometry.count; i++) {
      const i3 = i * 3;
      const i4 = i * 4;

      baseParticlesTexture.image.data[i4 + 0] =
        baseGeometry.instance.attributes.position.array[i3 + 0];
      baseParticlesTexture.image.data[i4 + 1] =
        baseGeometry.instance.attributes.position.array[i3 + 1];
      baseParticlesTexture.image.data[i4 + 2] =
        baseGeometry.instance.attributes.position.array[i3 + 2];
      baseParticlesTexture.image.data[i4 + 3] = Math.random();
    }

    // Particles variable
    const particlesVariable = computation.addVariable(
      "uParticles",
      gpgpuParticlesShader,
      baseParticlesTexture
    );
    computation.setVariableDependencies(particlesVariable, [particlesVariable]);

    // Uniforms on the gpgpu simulation material — exact names/values from original
    particlesVariable.material.uniforms.uTime = new THREE.Uniform(0);
    particlesVariable.material.uniforms.uBase = new THREE.Uniform(
      baseParticlesTexture
    );
    particlesVariable.material.uniforms.uDeltaTime = new THREE.Uniform(0);
    particlesVariable.material.uniforms.uFlowFieldInfluence = new THREE.Uniform(0.5);
    particlesVariable.material.uniforms.uFlowFieldStrength = new THREE.Uniform(2);
    particlesVariable.material.uniforms.uFlowFieldFrequency = new THREE.Uniform(0.5);

    // Init computation (requires real WebGL2 context — guarded above via empty-model check)
    computation.init();

    /**
     * Particles render geometry
     */
    const particlesUvArray = new Float32Array(baseGeometry.count * 2);
    const sizesArray = new Float32Array(baseGeometry.count);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = y * size + x;
        const i2 = i * 2;

        const uvX = (x + 0.5) / size;
        const uvY = (y + 0.5) / size;

        particlesUvArray[i2 + 0] = uvX;
        particlesUvArray[i2 + 1] = uvY;

        sizesArray[i] = Math.random();
      }
    }

    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setDrawRange(0, baseGeometry.count);
    particlesGeometry.setAttribute(
      "aParticlesUv",
      new THREE.BufferAttribute(particlesUvArray, 2)
    );
    particlesGeometry.setAttribute(
      "aColor",
      baseGeometry.instance.attributes.color
    );
    particlesGeometry.setAttribute(
      "aSize",
      new THREE.BufferAttribute(sizesArray, 1)
    );

    /**
     * Particles render material
     */
    const particlesMaterial = new THREE.ShaderMaterial({
      vertexShader: particlesVertexShader,
      fragmentShader: particlesFragmentShader,
      uniforms: {
        uSize: new THREE.Uniform(0.07),
        uResolution: new THREE.Uniform(
          new THREE.Vector2(
            sizes.width * sizes.pixelRatio,
            sizes.height * sizes.pixelRatio
          )
        ),
        uParticlesTexture: new THREE.Uniform(),
      },
    });

    // Points
    const particlesPoints = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesPoints);

    /**
     * GUI tweaks — verbatim from original script.js
     */
    ctx.gui.addColor(debugObject, "clearColor").onChange(() => {
      renderer.setClearColor(debugObject.clearColor);
    });
    ctx.gui
      .add(particlesMaterial.uniforms.uSize, "value")
      .min(0)
      .max(1)
      .step(0.001)
      .name("uSize");
    ctx.gui
      .add(particlesVariable.material.uniforms.uFlowFieldInfluence, "value")
      .min(0)
      .max(1)
      .step(0.001)
      .name("uFlowInfluence");
    ctx.gui
      .add(particlesVariable.material.uniforms.uFlowFieldStrength, "value")
      .min(0)
      .max(10)
      .step(0.001)
      .name("uFlowFieldStrength");
    ctx.gui
      .add(particlesVariable.material.uniforms.uFlowFieldFrequency, "value")
      .min(0)
      .max(1)
      .step(0.001)
      .name("uFlowFieldFrequency");

    // Store references for update/dispose/onResize
    this.gpgpu = computation;
    this.particlesVariable = particlesVariable;
    this.particles = particlesPoints;
    this.material = particlesMaterial;
    this._particlesGeometry = particlesGeometry;
  },

  onResize(sizes) {
    // Update uResolution when viewport changes
    // Original resize handler: particles.material.uniforms.uResolution.value.set(w*pr, h*pr)
    if (this.material) {
      this.material.uniforms.uResolution.value.set(
        sizes.width * sizes.pixelRatio,
        sizes.height * sizes.pixelRatio
      );
    }
  },

  update(elapsed, delta) {
    // Guard: gpgpu was never built (smoke case — empty model short-circuited init)
    if (!this.gpgpu) return;

    // GPGPU update — use elapsed/delta args (original used clock.getElapsedTime() + manual deltaTime)
    this.particlesVariable.material.uniforms.uTime.value = elapsed;
    this.particlesVariable.material.uniforms.uDeltaTime.value = delta;
    this.gpgpu.compute();
    this.material.uniforms.uParticlesTexture.value =
      this.gpgpu.getCurrentRenderTarget(this.particlesVariable).texture;
  },

  dispose() {
    // Dispose both ping-pong render targets from the gpgpu variable
    if (this.particlesVariable) {
      for (const rt of this.particlesVariable.renderTargets) {
        rt.dispose();
      }
    }
    // Dispose the GPUComputationRenderer if it exposes a dispose method
    this.gpgpu?.dispose?.();
    // Dispose particles geometry and material (not auto-disposed since scene.remove is engine-managed)
    this._particlesGeometry?.dispose();
    this.material?.dispose();
    // Null refs
    this.gpgpu = null;
    this.particlesVariable = null;
    this.particles = null;
    this.material = null;
    this._particlesGeometry = null;
  },
};
