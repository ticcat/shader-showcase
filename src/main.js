import "./style.css";
import { Engine } from "./engine/Engine.js";
import { manifest } from "./lessons/manifest.js";
import { createRouter } from "./ui/router.js";
import { createSidebar } from "./ui/sidebar.js";

const canvas = document.querySelector("canvas.webgl");
const overlay = document.querySelector("#overlay");
const nav = document.querySelector("#lesson-list");

const engine = new Engine(canvas);

function showOverlay(message) {
  overlay.textContent = message;
  overlay.hidden = false;
}
function hideOverlay() {
  overlay.hidden = true;
}

const sidebar = createSidebar(nav, manifest, (id) => router.go(id));

let loadToken = 0;
async function selectLesson(id) {
  const entry = manifest.find((l) => l.id === id);
  if (!entry) return;
  const token = ++loadToken;
  sidebar.setActive(id);
  showOverlay("Loading…");
  try {
    const module = await entry.load();
    if (token !== loadToken) return; // a newer selection superseded this one
    await engine.load(module.default);
    if (token !== loadToken) return;
    hideOverlay();
  } catch (err) {
    console.error(err);
    if (token === loadToken) showOverlay(`Failed to load "${entry.name}": ${err.message}`);
  }
}

const router = createRouter(manifest, selectLesson);
router.start();
