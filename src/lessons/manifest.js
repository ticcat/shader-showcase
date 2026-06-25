// Dynamic-import glob: Vite code-splits every existing ./<id>/index.js into its
// own chunk. A not-yet-ported lesson's import rejects at runtime (the glob has no
// entry for it), which callers handle (overlay error / smoke-harness [skip]).
const makeLessonLoader = (id) => () => import(`./${id}/index.js`);

export const manifest = [
  { id: "27-shaders", name: "27 · Shaders", load: makeLessonLoader("27-shaders") },
  { id: "28-shader-patterns", name: "28 · Shader Patterns", load: makeLessonLoader("28-shader-patterns") },
  { id: "29-raging-sea", name: "29 · Raging Sea", load: makeLessonLoader("29-raging-sea") },
  { id: "30-animated-galaxy", name: "30 · Animated Galaxy", load: makeLessonLoader("30-animated-galaxy") },
  { id: "31-modified-materials", name: "31 · Modified Materials", load: makeLessonLoader("31-modified-materials") },
  { id: "32-coffee-smoke", name: "32 · Coffee Smoke", load: makeLessonLoader("32-coffee-smoke") },
  { id: "33-hologram", name: "33 · Hologram", load: makeLessonLoader("33-hologram") },
  { id: "34-fireworks", name: "34 · Fireworks", load: makeLessonLoader("34-fireworks") },
  { id: "35-lights-shading", name: "35 · Lights Shading", load: makeLessonLoader("35-lights-shading") },
  { id: "36-raging-sea-shading", name: "36 · Raging Sea Shading", load: makeLessonLoader("36-raging-sea-shading") },
  { id: "37-halftone-shading", name: "37 · Halftone Shading", load: makeLessonLoader("37-halftone-shading") },
  { id: "38-earth", name: "38 · Earth", load: makeLessonLoader("38-earth") },
  { id: "39-particles-cursor", name: "39 · Particles Cursor", load: makeLessonLoader("39-particles-cursor") },
  { id: "40-particles-morphing", name: "40 · Particles Morphing", load: makeLessonLoader("40-particles-morphing") },
  { id: "41-gpgpu-flow-field", name: "41 · GPGPU Flow Field", load: makeLessonLoader("41-gpgpu-flow-field") },
  { id: "42-wobbly-sphere", name: "42 · Wobbly Sphere", load: makeLessonLoader("42-wobbly-sphere") },
  { id: "43-sliced-model", name: "43 · Sliced Model", load: makeLessonLoader("43-sliced-model") },
  { id: "44-procedural-terrain", name: "44 · Procedural Terrain", load: makeLessonLoader("44-procedural-terrain") },
];
