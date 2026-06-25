import { describe, it, expect, vi } from "vitest";
import { Engine } from "./Engine.js";

function stubDeps() {
  const listeners = [];
  return {
    createRenderer: () => ({
      setSize() {}, setPixelRatio() {}, setClearColor() {}, render() {},
      toneMapping: 0, toneMappingExposure: 1,
      shadowMap: { enabled: false, type: 0 },
      info: { memory: { geometries: 0, textures: 0 } },
      domElement: { addEventListener() {}, removeEventListener() {} },
    }),
    createControls: () => ({ target: { set() {} }, update() {}, enableDamping: true, enabled: true, dispose() {} }),
    createGui: () => ({ destroyed: false, destroy() { this.destroyed = true; }, hide() {}, show() {} }),
    createLoaders: () => ({}),
    raf: () => 0, // no-op loop in tests
    cancelRaf: () => {},
  };
}

describe("Engine lifecycle", () => {
  it("runs registered cleanups and dispose when switching scenes", async () => {
    const engine = new Engine({ addEventListener() {}, removeEventListener() {} }, stubDeps());
    const cleanup = vi.fn();
    const disposeA = vi.fn();
    const lessonA = {
      name: "A", config: {},
      init(ctx) { ctx.addCleanup(cleanup); },
      dispose: disposeA,
    };
    const lessonB = { name: "B", config: {}, init() {} };

    await engine.load(lessonA);
    await engine.load(lessonB);

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(disposeA).toHaveBeenCalledTimes(1);
  });

  it("removes registered event listeners on switch", async () => {
    const engine = new Engine({ addEventListener() {}, removeEventListener() {} }, stubDeps());
    const target = { addEventListener: vi.fn(), removeEventListener: vi.fn() };
    const handler = () => {};
    await engine.load({ name: "A", config: {}, init: (ctx) => ctx.registerEventListener(target, "click", handler) });
    expect(target.addEventListener).toHaveBeenCalledWith("click", handler);
    await engine.load({ name: "B", config: {}, init() {} });
    expect(target.removeEventListener).toHaveBeenCalledWith("click", handler);
  });

  it("recreates the gui each load and hides it when config.gui is false", async () => {
    const deps = stubDeps();
    const guis = [];
    deps.createGui = () => { const g = { destroyed: false, hidden: false, destroy() { this.destroyed = true; }, hide() { this.hidden = true; }, show() {} }; guis.push(g); return g; };
    const engine = new Engine({ addEventListener() {}, removeEventListener() {} }, deps);
    await engine.load({ name: "A", config: {}, init() {} });
    await engine.load({ name: "B", config: { gui: false }, init() {} });
    expect(guis[0].destroyed).toBe(true);   // first gui destroyed on second load
    expect(guis[1].hidden).toBe(true);       // second scene hides gui
  });
});
