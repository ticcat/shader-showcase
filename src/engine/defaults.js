import * as THREE from "three";

export const DEFAULT_CLEAR_COLOR = "#000000";

export const TONE_MAPPING = {
  None: THREE.NoToneMapping,
  Linear: THREE.LinearToneMapping,
  Reinhard: THREE.ReinhardToneMapping,
  Cineon: THREE.CineonToneMapping,
  ACESFilmic: THREE.ACESFilmicToneMapping,
};

export const SHADOW_MAP = {
  Basic: THREE.BasicShadowMap,
  PCF: THREE.PCFShadowMap,
  PCFSoft: THREE.PCFSoftShadowMap,
  VSM: THREE.VSMShadowMap,
};

export function disposeObject(root) {
  root.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of materials) {
      if (!material) continue;
      for (const value of Object.values(material)) {
        if (value && value.isTexture) value.dispose();
      }
      if (material.uniforms) {
        for (const uniform of Object.values(material.uniforms)) {
          if (uniform && uniform.value && uniform.value.isTexture) uniform.value.dispose();
        }
      }
      material.dispose();
    }
  });
}

export function applyBaseline({ renderer, scene, camera, controls }) {
  renderer.setClearColor(DEFAULT_CLEAR_COLOR, 1);
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = false;

  for (let i = scene.children.length - 1; i >= 0; i--) {
    const child = scene.children[i];
    disposeObject(child);
    scene.remove(child);
  }
  if (scene.background && scene.background.isTexture) scene.background.dispose();
  if (scene.environment) scene.environment.dispose();
  scene.background = null;
  scene.environment = null;
  scene.fog = null;

  camera.position.set(0, 0, 5);
  camera.fov = 75;
  camera.near = 0.1;
  camera.far = 100;
  camera.updateProjectionMatrix();

  controls.target.set(0, 0, 0);
  controls.enableDamping = true;
  controls.enabled = true;
  controls.update();
}

export function applyConfig({ renderer, camera, controls }, config = {}) {
  if (config.clearColor) renderer.setClearColor(config.clearColor, 1);
  if (config.toneMapping) renderer.toneMapping = TONE_MAPPING[config.toneMapping] ?? THREE.NoToneMapping;
  if (config.toneMappingExposure != null) renderer.toneMappingExposure = config.toneMappingExposure;
  if (config.shadowMap) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = SHADOW_MAP[config.shadowMap] ?? THREE.PCFSoftShadowMap;
  }
  if (config.camera) {
    if (config.camera.position) camera.position.set(...config.camera.position);
    if (config.camera.fov != null) camera.fov = config.camera.fov;
    if (config.camera.near != null) camera.near = config.camera.near;
    if (config.camera.far != null) camera.far = config.camera.far;
    camera.updateProjectionMatrix();
  }
  if (config.controls && config.controls.target) controls.target.set(...config.controls.target);
}
