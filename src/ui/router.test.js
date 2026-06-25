import { describe, it, expect, vi } from "vitest";
import { parseHash, formatHash } from "./router.js";

describe("router hash helpers", () => {
  it("parses a lesson id from the hash", () => {
    expect(parseHash("#/29-raging-sea")).toBe("29-raging-sea");
    expect(parseHash("")).toBeNull();
    expect(parseHash("#/")).toBeNull();
  });
  it("formats a lesson id into a hash", () => {
    expect(formatHash("29-raging-sea")).toBe("#/29-raging-sea");
  });
});
