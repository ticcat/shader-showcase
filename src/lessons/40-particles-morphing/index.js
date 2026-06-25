import gsap from "gsap";
import * as THREE from "three";
import particlesFragmentShader from "./shaders/particles/fragment.glsl";
import particlesVertexShader from "./shaders/particles/vertex.glsl";

// Asset URL — resolved at build time via Vite's import.meta.url
const modelUrl = new URL("./assets/models.glb", import.meta.url).href;

export default {
  name: "40 · Particles Morphing",

  config: {
    // Original: debugObject.clearColor = "#160920"; renderer.setClearColor(debugObject.clearColor)
    clearColor: "#160920",
    // Original: camera.position.set(0, 0, 8 * 2) → position [0, 0, 16]
    camera: {
      position: [0, 0, 16],
    },
  },

  init(ctx) {
    const { scene, sizes } = ctx;

    // Particle object reference — populated inside the GLTF load callback
    let particles = null;
    this._particles = null;

    const debugObject = {};
    debugObject.colorA = "#ff7300";
    debugObject.colorB = "#0091ff";

    // Load DRACO-compressed GLTF model.
    // ctx.loaders.gltf already has DRACOLoader configured at /draco/ — do NOT create a new one.
    ctx.loaders.gltf.load(modelUrl, (gltf) => {
      // SMOKE GUARD (CRITICAL): under the smoke harness, gltf.scene.children is empty
      // because the fake loader returns an empty Group. The particle construction reads
      // geometry.attributes.position from children and would throw with no children.
      // In the real browser the asset has 4 children (model shapes). Guard here so init
      // does NOT throw headless.
      if (!gltf.scene.children.length) return;

      particles = {};
      particles.index = 0;

      // Positions — collect BufferAttribute from each model child
      const positions = gltf.scene.children.map(
        (child) => child.geometry.attributes.position
      );

      // Compute maxCount: largest vertex count across all models, padded by 1.2x
      particles.maxCount = 0;
      for (const position of positions) {
        if (position.count > particles.maxCount)
          particles.maxCount = position.count;
      }
      particles.maxCount *= 1.2;

      // Build padded position arrays per model (pad extra slots with random existing vertices)
      particles.positions = [];
      for (const position of positions) {
        const originalArray = position.array;
        const newArray = new Float32Array(particles.maxCount * 3);

        for (let i = 0; i < particles.maxCount; i++) {
          const i3 = i * 3;

          if (i3 < originalArray.length) {
            newArray[i3 + 0] = originalArray[i3 + 0];
            newArray[i3 + 1] = originalArray[i3 + 1];
            newArray[i3 + 2] = originalArray[i3 + 2];
          } else {
            const randomIndex = Math.floor(position.count * Math.random()) * 3;
            newArray[i3 + 0] = originalArray[randomIndex + 0];
            newArray[i3 + 1] = originalArray[randomIndex + 1];
            newArray[i3 + 2] = originalArray[randomIndex + 2];
          }
        }

        particles.positions.push(new THREE.Float32BufferAttribute(newArray, 3));
      }

      // Geometry — random sizes per particle, initial position = model 0, target = model 3
      const sizesArray = new Float32Array(particles.maxCount);
      for (let i = 0; i < particles.maxCount; i++) {
        sizesArray[i] = Math.random();
      }

      particles.geometry = new THREE.BufferGeometry();
      particles.geometry.setIndex(null);
      particles.geometry.setAttribute(
        "position",
        particles.positions[particles.index]
      );
      particles.geometry.setAttribute("aPositionTarget", particles.positions[3]);
      particles.geometry.setAttribute(
        "aSize",
        new THREE.BufferAttribute(sizesArray, 1)
      );

      // Material
      particles.colorA = debugObject.colorA;
      particles.colorB = debugObject.colorB;

      particles.material = new THREE.ShaderMaterial({
        vertexShader: particlesVertexShader,
        fragmentShader: particlesFragmentShader,
        uniforms: {
          uSize: new THREE.Uniform(0.4),
          uResolution: new THREE.Uniform(
            new THREE.Vector2(
              sizes.width * sizes.pixelRatio,
              sizes.height * sizes.pixelRatio
            )
          ),
          uProgress: new THREE.Uniform(0),
          uColorA: new THREE.Uniform(new THREE.Color(particles.colorA)),
          uColorB: new THREE.Uniform(new THREE.Color(particles.colorB)),
          uParticlesFrequency: new THREE.Uniform(15),
          uModelFrequency: new THREE.Uniform(2),
          uTime: new THREE.Uniform(0),
        },
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      // Points
      particles.points = new THREE.Points(particles.geometry, particles.material);
      particles.points.frustumCulled = false;
      scene.add(particles.points);

      // Morph methods — update geometry attributes and animate uProgress via gsap.fromTo
      particles.morph = (index) => {
        // Update attributes
        particles.geometry.attributes.position =
          particles.positions[particles.index];
        particles.geometry.attributes.aPositionTarget = particles.positions[index];

        gsap.fromTo(
          particles.material.uniforms.uProgress,
          { value: 0 },
          { value: 1, duration: 3, ease: "linear" }
        );

        particles.index = index;
      };

      particles.morph0 = () => { particles.morph(0); };
      particles.morph1 = () => { particles.morph(1); };
      particles.morph2 = () => { particles.morph(2); };
      particles.morph3 = () => { particles.morph(3); };

      // GUI tweaks (verbatim from original script.js lines 152-193)
      ctx.gui
        .add(particles.material.uniforms.uSize, "value")
        .min(0.1)
        .max(1.0)
        .step(0.1)
        .name("uSize");
      ctx.gui
        .add(particles.material.uniforms.uParticlesFrequency, "value")
        .min(0.0)
        .max(30.0)
        .step(0.1)
        .name("uParticlesFrequency");
      ctx.gui
        .add(particles.material.uniforms.uModelFrequency, "value")
        .min(0.0)
        .max(5.0)
        .step(0.1)
        .name("uModelFrequency");
      ctx.gui
        .add(particles.material.uniforms.uProgress, "value")
        .min(0.0)
        .max(1.0)
        .step(0.001)
        .name("uProgress")
        .listen();
      ctx.gui
        .addColor(particles, "colorA")
        .name("colorA")
        .onChange(() =>
          particles.material.uniforms.uColorA.value.set(particles.colorA)
        );
      ctx.gui
        .addColor(particles, "colorB")
        .name("colorB")
        .onChange(() =>
          particles.material.uniforms.uColorB.value.set(particles.colorB)
        );

      ctx.gui.add(particles, "morph0");
      ctx.gui.add(particles, "morph1");
      ctx.gui.add(particles, "morph2");
      ctx.gui.add(particles, "morph3");

      // Store on this so onResize/update can access it
      this._particles = particles;

      // gsap cleanup: kill any running uProgress tween when switching scenes
      // (guard: material may be undefined if smoke guard fired)
      ctx.addCleanup(() => {
        if (particles && particles.material) {
          gsap.killTweensOf(particles.material.uniforms.uProgress);
        }
      });
    });
  },

  onResize(sizes) {
    // Update uResolution uniform when viewport changes
    // (original resize handler: particles.material.uniforms.uResolution.value.set(w*pr, h*pr))
    if (this._particles && this._particles.material) {
      this._particles.material.uniforms.uResolution.value.set(
        sizes.width * sizes.pixelRatio,
        sizes.height * sizes.pixelRatio
      );
    }
  },

  update(elapsed) {
    // Original tick() body (minus controls.update / renderer.render / rAF):
    // Update uTime uniform for particle animation noise
    // Guard: particles may not exist yet (GLTF not loaded, or smoke guard fired)
    if (this._particles && this._particles.material) {
      this._particles.material.uniforms.uTime.value = elapsed;
    }
  },

  dispose() {
    // Particles (geometry, material, points) are cleaned up by the engine's disposeObject
    // since they are attached to the scene. The gsap cleanup is registered in addCleanup.
    // Null refs to allow GC.
    this._particles = null;
  },
};
