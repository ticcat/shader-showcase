import * as THREE from "three";
import particlesVertexShader from "./shaders/particles/vertex.glsl";
import particlesFragmentShader from "./shaders/particles/fragment.glsl";

// Asset URLs — resolved at build time via Vite's import.meta.url
const glowUrl = new URL("./assets/glow.png", import.meta.url).href;
const pictureUrl = new URL("./assets/picture-1.png", import.meta.url).href;

export const config = {
  clearColor: "#181818",
  gui: false,
  // Original: camera.position.set(0, 0, 18), fov=35, near=0.1, far=100
  camera: {
    position: [0, 0, 18],
    fov: 35,
    near: 0.1,
    far: 100,
  },
};

export default {
  name: "39 · Particles Cursor",

  config,

  init(ctx) {
    // -------------------------------------------------------------------------
    // Textures
    // -------------------------------------------------------------------------
    this._pictureTexture = ctx.loaders.texture.load(pictureUrl);

    // Glow image — used in the 2D canvas draw routine
    this._glowImage = new Image();
    this._glowImage.src = glowUrl;

    // -------------------------------------------------------------------------
    // Displacement canvas (128×128) — provides the cursor trail texture
    // -------------------------------------------------------------------------
    const displacement = {};
    this._displacement = displacement;

    displacement.canvas = document.createElement("canvas");
    displacement.canvas.width = 128;
    displacement.canvas.height = 128;
    // Style mirrors the original (shows debug canvas, fixed top-left corner)
    displacement.canvas.style.position = "fixed";
    displacement.canvas.style.width = "256px";
    displacement.canvas.style.height = "256px";
    displacement.canvas.style.top = "0";
    displacement.canvas.style.left = "0";
    displacement.canvas.style.zIndex = "10";

    // Append to #stage if available (showcase app), fall back to body.
    // Under jsdom, document.querySelector("#stage") returns null — body fallback keeps smoke happy.
    const container = document.querySelector("#stage") || document.body;
    container.append(displacement.canvas);

    // Register cleanup so the extra canvas is removed on scene switch
    ctx.addCleanup(() => displacement.canvas.remove());

    // Guard: jsdom's getContext("2d") may return null; real browser always has context
    displacement.context = displacement.canvas.getContext("2d");
    if (displacement.context) {
      // Initial fill — black background so the texture starts dark
      displacement.context.fillRect(
        0,
        0,
        displacement.canvas.width,
        displacement.canvas.height
      );
    }

    // CanvasTexture for the displacement uniform
    displacement.texture = new THREE.CanvasTexture(displacement.canvas);
    this._displacementTexture = displacement.texture;

    // -------------------------------------------------------------------------
    // Interactive invisible plane (for raycasting cursor UV)
    // -------------------------------------------------------------------------
    displacement.interactivePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.MeshBasicMaterial({ color: "red", side: THREE.DoubleSide })
    );
    displacement.interactivePlane.visible = false;
    ctx.scene.add(displacement.interactivePlane);

    // -------------------------------------------------------------------------
    // Raycaster + cursor vectors
    // -------------------------------------------------------------------------
    displacement.raycaster = new THREE.Raycaster();
    displacement.screenCursor = new THREE.Vector2(9999, 9999);
    displacement.canvasCursor = new THREE.Vector2(9999, 9999);
    displacement.canvasCursorPrevious = new THREE.Vector2(9999, 9999);

    // Pointer move handler — tracks normalised screen coords
    const onPointerMove = (event) => {
      displacement.screenCursor.x =
        (event.clientX / ctx.sizes.width) * 2 - 1;
      // Original uses sizes.width (not height) for y — match verbatim
      displacement.screenCursor.y =
        -(event.clientY / ctx.sizes.width) * 2 + 1;
    };
    ctx.registerEventListener(window, "pointermove", onPointerMove);

    // -------------------------------------------------------------------------
    // Particles geometry + material
    // -------------------------------------------------------------------------
    const particlesGeometry = new THREE.PlaneGeometry(10, 10, 128, 128);
    particlesGeometry.setIndex(null);
    particlesGeometry.deleteAttribute("normal");

    const count = particlesGeometry.attributes.position.count;
    const intensitiesArray = new Float32Array(count);
    const anglesArray = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      intensitiesArray[i] = Math.random();
      anglesArray[i] = Math.random() * Math.PI * 2;
    }

    particlesGeometry.setAttribute(
      "aIntensity",
      new THREE.BufferAttribute(intensitiesArray, 1)
    );
    particlesGeometry.setAttribute(
      "aAngle",
      new THREE.BufferAttribute(anglesArray, 1)
    );

    const particlesMaterial = new THREE.ShaderMaterial({
      vertexShader: particlesVertexShader,
      fragmentShader: particlesFragmentShader,
      uniforms: {
        uResolution: new THREE.Uniform(
          new THREE.Vector2(
            ctx.sizes.width * ctx.sizes.pixelRatio,
            ctx.sizes.height * ctx.sizes.pixelRatio
          )
        ),
        uPictureTexture: new THREE.Uniform(this._pictureTexture),
        uDisplacementTexture: new THREE.Uniform(displacement.texture),
      },
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    ctx.scene.add(particles);

    // Store refs for update/resize/dispose
    this._material = particlesMaterial;
    this._geometry = particlesGeometry;
    this._particles = particles;
    this._ctx = ctx;
  },

  onResize(sizes) {
    if (this._material) {
      this._material.uniforms.uResolution.value.set(
        sizes.width * sizes.pixelRatio,
        sizes.height * sizes.pixelRatio
      );
    }
  },

  update(/* elapsed, delta */) {
    const displacement = this._displacement;
    if (!displacement) return;

    const ctx = this._ctx;

    // -------------------------------------------------------------------------
    // Raycaster — get cursor UV on the interactive plane
    // -------------------------------------------------------------------------
    displacement.raycaster.setFromCamera(
      displacement.screenCursor,
      ctx.camera
    );
    const intersections = displacement.raycaster.intersectObject(
      displacement.interactivePlane
    );

    if (intersections.length) {
      const uv = intersections[0].uv;
      displacement.canvasCursor.x = uv.x * displacement.canvas.width;
      displacement.canvasCursor.y = (1 - uv.y) * displacement.canvas.height;
    }

    // -------------------------------------------------------------------------
    // Canvas displacement drawing
    // Guard: jsdom's getContext("2d") returns null; real browser always has context
    // -------------------------------------------------------------------------
    if (!displacement.context) return;

    // Fade out
    displacement.context.globalCompositeOperation = "source-over";
    displacement.context.globalAlpha = 0.02;
    displacement.context.fillRect(
      0,
      0,
      displacement.canvas.width,
      displacement.canvas.height
    );

    // Speed alpha — scale by cursor movement distance
    const cursorDistance = displacement.canvasCursorPrevious.distanceTo(
      displacement.canvasCursor
    );
    displacement.canvasCursorPrevious.copy(displacement.canvasCursor);
    const alpha = Math.min(cursorDistance * 0.1, 1);

    // Draw glow
    const glowSize = displacement.canvas.width * 0.25;
    displacement.context.globalCompositeOperation = "lighten";
    displacement.context.globalAlpha = alpha;
    displacement.context.drawImage(
      this._glowImage,
      displacement.canvasCursor.x - glowSize * 0.5,
      displacement.canvasCursor.y - glowSize * 0.5,
      glowSize,
      glowSize
    );

    // Mark texture dirty so Three.js re-uploads it to GPU
    displacement.texture.needsUpdate = true;
  },

  dispose() {
    // Canvas DOM removal is handled by addCleanup registered in init.
    // Dispose CanvasTexture and picture/glow textures — not attached to a scene
    // material by the engine's disposeObject pass at this point.
    if (this._displacementTexture) {
      this._displacementTexture.dispose();
      this._displacementTexture = null;
    }
    if (this._pictureTexture) {
      this._pictureTexture.dispose();
      this._pictureTexture = null;
    }
    // Geometry and material are attached to the scene (engine disposes them)
    this._geometry = null;
    this._material = null;
    this._particles = null;
    this._displacement = null;
    this._glowImage = null;
    this._ctx = null;
  },
};
