import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import GUI from "lil-gui";
import { applyBaseline, applyConfig } from "./defaults.js";
import { createLoaders, loadEnvironment } from "./loaders.js";

const defaultDeps = {
  createRenderer: (canvas) => {
    const r = new THREE.WebGLRenderer({ canvas, antialias: true });
    return r;
  },
  createControls: (camera, canvas) => new OrbitControls(camera, canvas),
  createGui: () => new GUI({ width: 320 }),
  createLoaders,
  raf: (cb) => requestAnimationFrame(cb),
  cancelRaf: (id) => cancelAnimationFrame(id),
};

export class Engine {
  constructor(canvas, deps = defaultDeps) {
    this.deps = { ...defaultDeps, ...deps };
    this.canvas = canvas;
    this.window = typeof window !== "undefined" ? window : { addEventListener() {}, removeEventListener() {} };

    // Allow tests to pass a window-like object as first arg
    if (canvas && typeof canvas.addEventListener === "function" && !canvas.getContext) {
      this.window = canvas;
      this.canvas = { addEventListener() {}, removeEventListener() {} };
    }

    this.sizes = {
      width: typeof window !== "undefined" ? window.innerWidth : 800,
      height: typeof window !== "undefined" ? window.innerHeight : 600,
      pixelRatio: typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1,
    };

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, this.sizes.width / this.sizes.height, 0.1, 100);
    this.camera.position.set(0, 0, 5);
    this.scene.add(this.camera);

    this.renderer = this.deps.createRenderer(this.canvas);
    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(this.sizes.pixelRatio);

    this.controls = this.deps.createControls(this.camera, this.canvas);
    this.controls.enableDamping = true;

    this.loaders = this.deps.createLoaders();
    this.clock = new THREE.Clock();
    this.gui = null;
    this.current = null;
    this.cleanups = [];
    this.listeners = [];
    this.lastTime = 0;

    this._onResize = () => this.resize();
    this.window.addEventListener("resize", this._onResize);

    this.start();
  }

  resize() {
    this.sizes.width = this.window.innerWidth;
    this.sizes.height = this.window.innerHeight;
    this.sizes.pixelRatio = Math.min(this.window.devicePixelRatio, 2);
    this.camera.aspect = this.sizes.width / this.sizes.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(this.sizes.pixelRatio);
    this.current?.onResize?.(this.sizes);
  }

  runCleanups() {
    for (const { target, type, handler } of this.listeners) target.removeEventListener(type, handler);
    this.listeners = [];
    for (const fn of this.cleanups) { try { fn(); } catch (e) { console.error(e); } }
    this.cleanups = [];
  }

  buildContext() {
    return {
      scene: this.scene,
      camera: this.camera,
      renderer: this.renderer,
      controls: this.controls,
      gui: this.gui,
      sizes: this.sizes,
      loaders: this.loaders,
      registerEventListener: (target, type, handler, options) => {
        if (options !== undefined) {
          target.addEventListener(type, handler, options);
        } else {
          target.addEventListener(type, handler);
        }
        this.listeners.push({ target, type, handler });
      },
      addCleanup: (fn) => this.cleanups.push(fn),
    };
  }

  async load(lesson) {
    // Tear down previous scene
    this.runCleanups();
    try { this.current?.dispose?.(); } catch (e) { console.error(e); }
    this.current = null;

    applyBaseline(this);

    // Fresh GUI per scene
    if (this.gui) this.gui.destroy();
    this.gui = this.deps.createGui();

    const config = lesson.config || {};
    applyConfig(this, config);
    if (config.gui === false) this.gui.hide(); else this.gui.show();

    if (config.environment) {
      const env = await loadEnvironment(this.loaders.rgbe, config.environment);
      this.scene.environment = env;
      if (config.background !== false) this.scene.background = env;
    }

    const ctx = this.buildContext();
    await lesson.init(ctx);
    this.current = lesson;
  }

  start() {
    const loop = () => {
      const elapsed = this.clock.getElapsedTime();
      const delta = elapsed - this.lastTime;
      this.lastTime = elapsed;
      this.controls.update();
      try { this.current?.update?.(elapsed, delta); } catch (e) { console.error(e); }
      this.renderer.render(this.scene, this.camera);
      this.rafId = this.deps.raf(loop);
    };
    this.rafId = this.deps.raf(loop);
  }

  dispose() {
    this.deps.cancelRaf(this.rafId);
    this.window.removeEventListener("resize", this._onResize);
    this.runCleanups();
    try { this.current?.dispose?.(); } catch (e) { console.error(e); }
  }
}
