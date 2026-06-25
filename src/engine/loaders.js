import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

export function createLoaders() {
  const draco = new DRACOLoader();
  draco.setDecoderPath("/draco/");

  const gltf = new GLTFLoader();
  gltf.setDRACOLoader(draco);

  return {
    gltf,
    rgbe: new RGBELoader(),
    texture: new THREE.TextureLoader(),
    cube: new THREE.CubeTextureLoader(),
  };
}

export function loadEnvironment(rgbeLoader, url) {
  return new Promise((resolve, reject) => {
    rgbeLoader.load(
      url,
      (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        resolve(texture);
      },
      undefined,
      reject
    );
  });
}
