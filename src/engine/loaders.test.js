import { describe, it, expect } from "vitest";
import { createLoaders } from "./loaders.js";

describe("createLoaders", () => {
  it("returns gltf, rgbe, texture, and cube loaders", () => {
    const loaders = createLoaders();
    expect(loaders.gltf).toBeDefined();
    expect(loaders.rgbe).toBeDefined();
    expect(loaders.texture).toBeDefined();
    expect(loaders.cube).toBeDefined();
  });

  it("configures the gltf loader with a draco loader", () => {
    const loaders = createLoaders();
    expect(loaders.gltf.dracoLoader).toBeTruthy();
  });
});
