// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { createSidebar } from "./sidebar.js";

const manifest = [
  { id: "27-shaders", name: "27 · Shaders" },
  { id: "29-raging-sea", name: "29 · Raging Sea" },
];

describe("createSidebar", () => {
  it("renders a link per lesson", () => {
    const nav = document.createElement("nav");
    createSidebar(nav, manifest, () => {});
    expect(nav.querySelectorAll("a").length).toBe(2);
    expect(nav.querySelector("a").getAttribute("href")).toBe("#/27-shaders");
  });

  it("marks the active lesson", () => {
    const nav = document.createElement("nav");
    const sidebar = createSidebar(nav, manifest, () => {});
    sidebar.setActive("29-raging-sea");
    const active = nav.querySelector("a.active");
    expect(active.textContent).toBe("29 · Raging Sea");
  });

  it("calls onSelect when a link is clicked", () => {
    const nav = document.createElement("nav");
    const onSelect = vi.fn();
    createSidebar(nav, manifest, onSelect);
    nav.querySelector("a").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onSelect).toHaveBeenCalledWith("27-shaders");
  });
});
