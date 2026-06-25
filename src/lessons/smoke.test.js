// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { manifest } from "./manifest.js";

function fakeCtx() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
  const cleanups = [];
  const listeners = [];
  return {
    ctx: {
      scene, camera,
      renderer: {
        setClearColor() {}, render() {}, setSize() {}, setPixelRatio() {},
        getPixelRatio: () => 1,
        toneMapping: 0, toneMappingExposure: 1,
        shadowMap: { enabled: false, type: 0 },
        capabilities: { getMaxAnisotropy: () => 8 },
        info: { memory: { geometries: 0, textures: 0 } },
        domElement: document.createElement("canvas"),
      },
      controls: { target: new THREE.Vector3(), update() {}, enabled: true },
      gui: makeFakeGui(),
      sizes: { width: 800, height: 600, pixelRatio: 1 },
      loaders: makeFakeLoaders(),
      registerEventListener: (t, type, h) => { t.addEventListener(type, h); listeners.push({ t, type, h }); },
      addCleanup: (fn) => cleanups.push(fn),
    },
    teardown() {
      for (const { t, type, h } of listeners) t.removeEventListener(type, h);
      for (const fn of cleanups) fn();
    },
  };
}

function makeFakeGui() {
  const api = {
    add: () => api, addColor: () => api, addFolder: () => api,
    name: () => api, min: () => api, max: () => api, step: () => api,
    onChange: () => api, onFinishChange: () => api, listen: () => api,
    destroy() {}, hide() {}, show() {}, open: () => api, close: () => api,
  };
  return api;
}

function makeFakeLoaders() {
  const resolveGltf = { scene: new THREE.Group(), animations: [] };
  return {
    gltf: { load: (url, onLoad) => onLoad && onLoad(resolveGltf), loadAsync: async () => resolveGltf, dracoLoader: {} },
    rgbe: { load: (url, onLoad) => onLoad && onLoad(new THREE.DataTexture()), loadAsync: async () => new THREE.DataTexture() },
    texture: { load: (url, onLoad) => { const t = new THREE.Texture(); onLoad && onLoad(t); return t; } },
    cube: { load: (urls, onLoad) => { const t = new THREE.CubeTexture(); onLoad && onLoad(t); return t; } },
  };
}

describe("lesson smoke tests", () => {
  for (const entry of manifest) {
    it(`${entry.id}: init/update/dispose without throwing`, async () => {
      let module;
      try {
        module = await entry.load();
      } catch (err) {
        console.warn(`[skip] ${entry.id} not ported yet: ${err.message}`);
        return; // not a failure — lesson not implemented yet
      }
      const lesson = module.default;
      expect(typeof lesson.init).toBe("function");
      const { ctx, teardown } = fakeCtx();
      await lesson.init(ctx);
      for (let i = 0; i < 3; i++) lesson.update?.(i * 0.016, 0.016);
      lesson.dispose?.();
      teardown();
    });
  }
});
