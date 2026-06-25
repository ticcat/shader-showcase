import * as THREE from "three";
import earthVertexShader from "./shaders/earth/vertex.glsl";
import earthFragmentShader from "./shaders/earth/fragment.glsl";
import atmosphereVertexShader from "./shaders/atmosphere/vertex.glsl";
import atmosphereFragmentShader from "./shaders/atmosphere/fragment.glsl";
import sunVertexShader from "./shaders/sun/vertex.glsl";
import sunFragmentShader from "./shaders/sun/fragment.glsl";

const earthDayTextureUrl = new URL("./assets/earth/day.jpg", import.meta.url).href;
const earthNightTextureUrl = new URL("./assets/earth/night.jpg", import.meta.url).href;
const earthSpecularCloudsTextureUrl = new URL("./assets/earth/specularClouds.jpg", import.meta.url).href;
const sunLensFlareUrl = new URL("./assets/lenses/lensflare0.png", import.meta.url).href;

export default {
  name: "38 · Earth",

  config: {
    clearColor: "#000011",
    camera: {
      position: [12, 5, 4],
    },
  },

  init(ctx) {
    // Textures
    const earthDayTexture = ctx.loaders.texture.load(earthDayTextureUrl);
    const earthNightTexture = ctx.loaders.texture.load(earthNightTextureUrl);
    const earthSpecularCloudsTexture = ctx.loaders.texture.load(earthSpecularCloudsTextureUrl);
    const sunLensFlare = ctx.loaders.texture.load(sunLensFlareUrl);

    // Texture repeat
    earthSpecularCloudsTexture.wrapS = THREE.RepeatWrapping;
    earthSpecularCloudsTexture.wrapT = THREE.RepeatWrapping;

    // Colorspace
    earthDayTexture.colorSpace = THREE.SRGBColorSpace;
    earthNightTexture.colorSpace = THREE.SRGBColorSpace;

    // Anisotropy (hardcoded 8 per original source)
    earthDayTexture.anisotropy = 8;
    earthNightTexture.anisotropy = 8;
    earthSpecularCloudsTexture.anisotropy = 8;

    /**
     * Earth
     */
    const earthParameters = {};
    earthParameters.atmosphereDayColor = "#00aaff";
    earthParameters.atmosphereTwilightColor = "#ff6600";

    // Geometry
    const earthGeometry = new THREE.SphereGeometry(2, 64, 64);

    // Earth material
    const earthMaterial = new THREE.ShaderMaterial({
      vertexShader: earthVertexShader,
      fragmentShader: earthFragmentShader,
      uniforms: {
        uTime: new THREE.Uniform(0),
        uDayTexture: new THREE.Uniform(earthDayTexture),
        uNightTexture: new THREE.Uniform(earthNightTexture),
        uSpecularCloudsTexture: new THREE.Uniform(earthSpecularCloudsTexture),
        uSunDirection: new THREE.Uniform(new THREE.Vector3(0.0, 0.0, 1.0)),
        uFresnelPower: new THREE.Uniform(2),
        uAtmosphereDayColor: new THREE.Uniform(
          new THREE.Color(earthParameters.atmosphereDayColor)
        ),
        uAtmosphereTwilightColor: new THREE.Uniform(
          new THREE.Color(earthParameters.atmosphereTwilightColor)
        ),
        uSpecularPower: new THREE.Uniform(32.0),
      },
    });

    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    ctx.scene.add(earth);

    // Atmosphere material
    const atmosphereMaterial = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      uniforms: {
        uSunDirection: new THREE.Uniform(new THREE.Vector3(0, 0, 1)),
        uAtmosphereDayColor: new THREE.Uniform(
          new THREE.Color(earthParameters.atmosphereDayColor)
        ),
        uAtmosphereTwilightColor: new THREE.Uniform(
          new THREE.Color(earthParameters.atmosphereTwilightColor)
        ),
      },
    });

    const atmosphere = new THREE.Mesh(earthGeometry, atmosphereMaterial);
    atmosphere.scale.set(1.04, 1.04, 1.04);
    ctx.scene.add(atmosphere);

    // Earth/Atmosphere tweaks
    const earthGui = ctx.gui.addFolder("Earth");
    earthGui
      .add(earthMaterial.uniforms.uFresnelPower, "value")
      .min(1)
      .max(5)
      .step(0.001)
      .name("uFresnelPower");
    earthGui
      .addColor(earthParameters, "atmosphereDayColor")
      .onChange(() => {
        earthMaterial.uniforms.uAtmosphereDayColor.value.set(
          earthParameters.atmosphereDayColor
        );
        atmosphereMaterial.uniforms.uAtmosphereDayColor.value.set(
          earthParameters.atmosphereDayColor
        );
      })
      .name("u atmo. day color");
    earthGui
      .addColor(earthParameters, "atmosphereTwilightColor")
      .onChange(() => {
        earthMaterial.uniforms.uAtmosphereTwilightColor.value.set(
          earthParameters.atmosphereTwilightColor
        );
        atmosphereMaterial.uniforms.uAtmosphereTwilightColor.value.set(
          earthParameters.atmosphereTwilightColor
        );
      })
      .name("u atmo. twilight color");
    earthGui
      .add(earthMaterial.uniforms.uSpecularPower, "value")
      .min(0)
      .max(100)
      .step(1)
      .name("uSpecularPower");

    /**
     * Sun
     */
    const sunSpherical = new THREE.Spherical(1, Math.PI * 0.5, 0.5);
    const sunDirection = new THREE.Vector3();
    const sunParameters = {};
    sunParameters.sunColor = "#ffffff";

    const sunMaterial = new THREE.ShaderMaterial({
      vertexShader: sunVertexShader,
      fragmentShader: sunFragmentShader,
      uniforms: {
        uLensFlareTexture: new THREE.Uniform(sunLensFlare),
        uSunColor: new THREE.Uniform(new THREE.Color(sunParameters.sunColor)),
      },
    });

    const sun = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 2), sunMaterial);
    ctx.scene.add(sun);

    const updateSun = () => {
      // Sun direction
      sunDirection.setFromSpherical(sunSpherical);

      // Update material
      earthMaterial.uniforms.uSunDirection.value.copy(sunDirection);
      atmosphereMaterial.uniforms.uSunDirection.value.copy(sunDirection);

      // Debug
      sun.position.copy(sunDirection).multiplyScalar(5);
    };

    updateSun();

    // Sun tweaks
    const sunGui = ctx.gui.addFolder("Sun");
    sunGui.add(sunSpherical, "phi").min(0).max(Math.PI).onChange(updateSun);
    sunGui
      .add(sunSpherical, "theta")
      .min(-Math.PI)
      .max(Math.PI)
      .onChange(updateSun);
    sunGui
      .addColor(sunParameters, "sunColor")
      .onChange(() =>
        sunMaterial.uniforms.uSunColor.value.set(sunParameters.sunColor)
      );

    // Store refs for update/dispose
    this._earth = earth;
    this._earthMaterial = earthMaterial;
    this._atmosphere = atmosphere;
    this._atmosphereMaterial = atmosphereMaterial;
    this._sun = sun;
    this._sunMaterial = sunMaterial;
  },

  update(elapsed) {
    this._earth.rotation.y = elapsed * 0.1;

    // Update materials
    this._earthMaterial.uniforms.uTime.value = elapsed;
  },

  dispose() {
    // Engine's disposeObject safety net handles geometry, materials, and textures.
    this._earth = null;
    this._earthMaterial = null;
    this._atmosphere = null;
    this._atmosphereMaterial = null;
    this._sun = null;
    this._sunMaterial = null;
  },
};
