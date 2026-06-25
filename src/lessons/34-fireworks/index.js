import gsap from "gsap";
import * as THREE from "three";
import { Sky } from "three/addons/objects/Sky.js";
import fireworkVertexShader from "./shaders/firework/vertex.glsl";
import fireworkFragmentShader from "./shaders/firework/fragment.glsl";

// Asset URLs — resolved at build time via Vite's import.meta.url
const particleUrls = [
  new URL("./assets/particles/1.png", import.meta.url).href,
  new URL("./assets/particles/2.png", import.meta.url).href,
  new URL("./assets/particles/3.png", import.meta.url).href,
  new URL("./assets/particles/4.png", import.meta.url).href,
  new URL("./assets/particles/5.png", import.meta.url).href,
  new URL("./assets/particles/6.png", import.meta.url).href,
  new URL("./assets/particles/7.png", import.meta.url).href,
  new URL("./assets/particles/8.png", import.meta.url).href,
];

export default {
  name: "34 · Fireworks",

  config: {
    // Original: no explicit clearColor set — Sky provides the background
    // Original: camera.position.set(1.5, 0, 6), fov = 25, near = 0.1, far = 100
    camera: {
      position: [1.5, 0, 6],
      fov: 25,
      near: 0.1,
      far: 100,
    },
    // Original: renderer.toneMapping not set explicitly — toneMappingExposure
    // is wired through the Sky GUI (skyParams.exposure = renderer.toneMappingExposure)
  },

  init(ctx) {
    // -----------------------------------------------------------------------
    // Textures — load all 8 particle textures (original uses textureLoader)
    // -----------------------------------------------------------------------
    const textures = particleUrls.map((url) => ctx.loaders.texture.load(url));

    // -----------------------------------------------------------------------
    // Resolution uniform — shared across all firework materials
    // Updated in onResize() whenever the viewport changes.
    // -----------------------------------------------------------------------
    this._resolution = new THREE.Vector2(
      ctx.sizes.width * ctx.sizes.pixelRatio,
      ctx.sizes.height * ctx.sizes.pixelRatio
    );

    // Track active fireworks for cleanup
    this._fireworks = [];

    // Store scene ref for use in createFirework (called from event listener)
    const scene = ctx.scene;
    const resolution = this._resolution;
    const fireworks = this._fireworks;

    // -----------------------------------------------------------------------
    // createFirework (verbatim from original script.js lines 100-186)
    // -----------------------------------------------------------------------
    const createFirework = (count, position, size, texture, radius, initialColor, finalColor) => {
      // Geometry
      const positionsArray = new Float32Array(count * 3);
      const sizesArray = new Float32Array(count);
      const timeMultipliersArray = new Float32Array(count);

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;

        const spherical = new THREE.Spherical(
          radius * (0.75 + Math.random() * 0.25),
          Math.random() * Math.PI,
          Math.random() * Math.PI * 2
        );
        const pos = new THREE.Vector3();
        pos.setFromSpherical(spherical);

        positionsArray[i3]     = pos.x;
        positionsArray[i3 + 1] = pos.y;
        positionsArray[i3 + 2] = pos.z;

        sizesArray[i] = Math.random();

        timeMultipliersArray[i] = 1 + Math.random();
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positionsArray, 3)
      );
      geometry.setAttribute(
        "aSize",
        new THREE.Float32BufferAttribute(sizesArray, 1)
      );
      geometry.setAttribute(
        "aTimeMultiplier",
        new THREE.Float32BufferAttribute(timeMultipliersArray, 1)
      );

      // Material
      texture.flipY = false;
      const material = new THREE.ShaderMaterial({
        vertexShader: fireworkVertexShader,
        fragmentShader: fireworkFragmentShader,
        uniforms: {
          uResolution: new THREE.Uniform(resolution),
          uSize: new THREE.Uniform(size),
          uTexture: new THREE.Uniform(texture),
          uInitialColor: new THREE.Uniform(initialColor),
          uFinalColor: new THREE.Uniform(finalColor),
          uProgress: new THREE.Uniform(0),
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      // Points
      const firework = new THREE.Points(geometry, material);
      firework.position.copy(position);
      scene.add(firework);
      fireworks.push(firework);

      // Dispose on animation complete
      const destroy = () => {
        scene.remove(firework);
        geometry.dispose();
        material.dispose();
        const idx = fireworks.indexOf(firework);
        if (idx !== -1) fireworks.splice(idx, 1);
      };

      // Animate uProgress from 0 to 1 over 3 seconds (verbatim from original)
      gsap.to(material.uniforms.uProgress, {
        value: 1,
        duration: 3,
        ease: "linear",
        onComplete: destroy,
      });
    };

    // -----------------------------------------------------------------------
    // createRandomFirework (verbatim from original script.js lines 188-212)
    // -----------------------------------------------------------------------
    const createRandomFirework = () => {
      const count = Math.round(400 + Math.random() * 1000);
      const position = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random(),
        (Math.random() - 0.5) * 2
      );
      const size = 0.1 + Math.random() * 0.1;
      const texture = textures[Math.floor(Math.random() * textures.length)];
      const radius = 0.5 + Math.random();
      const initialColor = new THREE.Color();
      initialColor.setHSL(Math.random(), 1, 0.7);
      const finalColor = new THREE.Color();
      finalColor.setHSL(Math.random(), 1, 0.7);

      createFirework(count, position, size, texture, radius, initialColor, finalColor);
    };

    // -----------------------------------------------------------------------
    // Single initial spawn (original: createRandomFirework() at line 223)
    // -----------------------------------------------------------------------
    createRandomFirework();

    // -----------------------------------------------------------------------
    // Click spawning — use registerEventListener so it auto-unbinds on switch
    // (original: window.addEventListener("click", createRandomFirework))
    // -----------------------------------------------------------------------
    ctx.registerEventListener(window, "click", createRandomFirework);

    // -----------------------------------------------------------------------
    // Sky (original: lines 230-271)
    // -----------------------------------------------------------------------
    const sky = new Sky();
    sky.scale.setScalar(450000);
    ctx.scene.add(sky);

    const sun = new THREE.Vector3();

    const skyParams = {
      turbidity: 10,
      rayleigh: 3,
      mieCoefficient: 0.005,
      mieDirectionalG: 0.95,
      elevation: -2.2,
      azimuth: 180,
      // Original: skyParams.exposure = renderer.toneMappingExposure (default 1)
      exposure: ctx.renderer.toneMappingExposure,
    };

    const updateSky = () => {
      const uniforms = sky.material.uniforms;
      uniforms["turbidity"].value = skyParams.turbidity;
      uniforms["rayleigh"].value = skyParams.rayleigh;
      uniforms["mieCoefficient"].value = skyParams.mieCoefficient;
      uniforms["mieDirectionalG"].value = skyParams.mieDirectionalG;

      const phi = THREE.MathUtils.degToRad(90 - skyParams.elevation);
      const theta = THREE.MathUtils.degToRad(90 - skyParams.azimuth);

      sun.setFromSphericalCoords(1, phi, theta);

      uniforms["sunPosition"].value.copy(sun);

      // Wire exposure to renderer (original: renderer.toneMappingExposure = skyParams.exposure)
      ctx.renderer.toneMappingExposure = skyParams.exposure;
    };

    // GUI sky controls (verbatim ranges from original lines 263-269)
    ctx.gui.add(skyParams, "turbidity", 0.0, 20.0, 0.1).onChange(updateSky);
    ctx.gui.add(skyParams, "rayleigh", 0.0, 4, 0.001).onChange(updateSky);
    ctx.gui.add(skyParams, "mieCoefficient", 0.0, 0.1, 0.001).onChange(updateSky);
    ctx.gui.add(skyParams, "mieDirectionalG", 0.0, 1, 0.001).onChange(updateSky);
    ctx.gui.add(skyParams, "elevation", -3, 10, 0.01).onChange(updateSky);
    ctx.gui.add(skyParams, "azimuth", -180, 180, 0.1).onChange(updateSky);
    ctx.gui.add(skyParams, "exposure", 0, 1, 0.0001).onChange(updateSky);

    updateSky();

    // -----------------------------------------------------------------------
    // Cleanup — kill all gsap tweens and dispose active fireworks
    // Registered via ctx.addCleanup so it runs automatically on scene switch
    // -----------------------------------------------------------------------
    ctx.addCleanup(() => {
      for (const fw of this._fireworks) {
        gsap.killTweensOf(fw.material.uniforms.uProgress);
        ctx.scene.remove(fw);
        fw.geometry.dispose();
        fw.material.dispose();
      }
      this._fireworks = [];
    });

    // Store refs
    this._sky = sky;
    this._textures = textures;
  },

  onResize(sizes) {
    // Update the shared resolution uniform used by all firework materials
    // (original: sizes.resolution.set(w * pixelRatio, h * pixelRatio) in resize handler)
    if (this._resolution) {
      this._resolution.set(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio);
    }
  },

  update(/* elapsed, delta */) {
    // Firework animation is fully gsap-driven via uProgress uniforms.
    // The original tick() only called controls.update() + renderer.render() —
    // both owned by the engine. Nothing to do here.
  },

  dispose() {
    // Active fireworks are cleaned up in addCleanup (registered in init).
    // Sky is attached to the scene and will be cleaned by the engine's disposeObject.
    // Null refs to allow GC.
    this._sky = null;
    this._resolution = null;
    this._textures = null;
    this._fireworks = [];
  },
};
