import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { applyBaseline, applyConfig, TONE_MAPPING, SHADOW_MAP } from "./defaults.js";

function makeContext() {
  // Use stub renderer since WebGLRenderer construction fails without WebGL context in jsdom
  const renderer = { setClearColor() {}, toneMapping: 0, toneMappingExposure: 1, shadowMap: { enabled: false, type: 0 } };
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 1, 10);
  const controls = { target: new THREE.Vector3(9, 9, 9), enableDamping: false, enabled: false, update() {} };
  return { renderer, scene, camera, controls };
}

describe("applyBaseline", () => {
  it("resets renderer tone mapping and shadow map", () => {
    const ctx = makeContext();
    ctx.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    ctx.renderer.shadowMap.enabled = true;
    applyBaseline(ctx);
    expect(ctx.renderer.toneMapping).toBe(THREE.NoToneMapping);
    expect(ctx.renderer.shadowMap.enabled).toBe(false);
  });

  it("clears the scene graph and env", () => {
    const ctx = makeContext();
    ctx.scene.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()));
    ctx.scene.background = new THREE.Color("#fff");
    applyBaseline(ctx);
    expect(ctx.scene.children.length).toBe(0);
    expect(ctx.scene.background).toBeNull();
    expect(ctx.scene.environment).toBeNull();
  });

  it("resets camera and controls", () => {
    const ctx = makeContext();
    applyBaseline(ctx);
    expect(ctx.camera.fov).toBe(75);
    expect(ctx.camera.position.toArray()).toEqual([0, 0, 5]);
    expect(ctx.controls.target.toArray()).toEqual([0, 0, 0]);
    expect(ctx.controls.enabled).toBe(true);
  });
});

describe("applyConfig", () => {
  it("applies tone mapping and camera position from config", () => {
    const ctx = makeContext();
    applyConfig(ctx, { toneMapping: "ACESFilmic", camera: { position: [1, 2, 3], fov: 35 } });
    expect(ctx.renderer.toneMapping).toBe(THREE.ACESFilmicToneMapping);
    expect(ctx.camera.position.toArray()).toEqual([1, 2, 3]);
    expect(ctx.camera.fov).toBe(35);
  });

  it("maps shadow map names to constants", () => {
    expect(SHADOW_MAP.PCFSoft).toBe(THREE.PCFSoftShadowMap);
    expect(TONE_MAPPING.ACESFilmic).toBe(THREE.ACESFilmicToneMapping);
  });
});
