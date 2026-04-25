import {
  ACESFilmicToneMapping,
  Box3,
  Cache,
  CanvasTexture,
  ClampToEdgeWrapping,
  Color,
  CylinderGeometry,
  DoubleSide,
  EquirectangularReflectionMapping,
  Group,
  HemisphereLight,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MOUSE,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  SpotLight,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { clone as cloneSkinnedScene } from "three/addons/utils/SkeletonUtils.js";

const MODEL_CACHE_NAME = "solar-terms-costume-model-v1";
const runtimeResourceCache = new Map();

function resolveRuntimeAssetPath(assetPath) {
  if (typeof assetPath !== "string" || !assetPath) return assetPath;
  if (!assetPath.startsWith("/")) return assetPath;
  if (typeof window === "undefined") return assetPath;

  const normalizedPath = assetPath.replace(/^\//, "");
  const basePrefix = window.location.pathname.includes("/pages/") ? "../" : "./";
  const resolvedPath = basePrefix + normalizedPath;
  return window.SiteAssetVersion?.append ? window.SiteAssetVersion.append(resolvedPath) : resolvedPath;
}

const DRACO_DECODER_PATH = resolveRuntimeAssetPath("/assets/draco/");

Cache.enabled = true;

function createShadowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(256, 256, 60, 256, 256, 220);
  gradient.addColorStop(0, "rgba(44, 28, 20, 0.48)");
  gradient.addColorStop(0.4, "rgba(44, 28, 20, 0.22)");
  gradient.addColorStop(1, "rgba(44, 28, 20, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function createDarkEnvironmentMap(renderer) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const context = canvas.getContext("2d");

  const base = context.createLinearGradient(0, 0, 0, canvas.height);
  base.addColorStop(0, "#20252b");
  base.addColorStop(0.42, "#2b3338");
  base.addColorStop(0.72, "#1c2227");
  base.addColorStop(1, "#13181c");
  context.fillStyle = base;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const warmPool = context.createRadialGradient(512, 164, 90, 512, 188, 360);
  warmPool.addColorStop(0, "rgba(148, 188, 176, 0.18)");
  warmPool.addColorStop(0.42, "rgba(88, 116, 118, 0.08)");
  warmPool.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = warmPool;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const sideGlow = context.createRadialGradient(180, 222, 40, 180, 222, 220);
  sideGlow.addColorStop(0, "rgba(126, 154, 165, 0.08)");
  sideGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = sideGlow;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const environmentTexture = new CanvasTexture(canvas);
  environmentTexture.colorSpace = SRGBColorSpace;
  environmentTexture.mapping = EquirectangularReflectionMapping;
  environmentTexture.wrapS = ClampToEdgeWrapping;
  environmentTexture.wrapT = ClampToEdgeWrapping;

  const pmremGenerator = new PMREMGenerator(renderer);
  const envMap = pmremGenerator.fromEquirectangular(environmentTexture).texture;
  pmremGenerator.dispose();
  environmentTexture.dispose();
  return envMap;
}

async function readModelArrayBuffer(modelPath) {
  const resolvedModelPath = resolveRuntimeAssetPath(modelPath);
  const existing = runtimeResourceCache.get(resolvedModelPath);
  if (existing) {
    const arrayBuffer = await existing;
    return arrayBuffer.slice(0);
  }

  const request = (async () => {
    if (typeof window !== "undefined" && window.ModelPreload && typeof window.ModelPreload.preload === "function") {
      const preloadedBuffer = await window.ModelPreload.preload(resolvedModelPath);
      if (preloadedBuffer) return preloadedBuffer.slice(0);
    }

    let response;

    if ("caches" in window) {
      const cache = await caches.open(MODEL_CACHE_NAME);
      response = await cache.match(resolvedModelPath);

      if (!response) {
        const networkResponse = await fetch(resolvedModelPath, { cache: "force-cache" });
        if (!networkResponse.ok) throw new Error("Model request failed");
        await cache.put(resolvedModelPath, networkResponse.clone());
        response = networkResponse;
      }
    } else {
      response = await fetch(resolvedModelPath, { cache: "force-cache" });
      if (!response.ok) throw new Error("Model request failed");
    }

    return await response.arrayBuffer();
  })();

  runtimeResourceCache.set(resolvedModelPath, request);

  try {
    const arrayBuffer = await request;
    runtimeResourceCache.set(resolvedModelPath, Promise.resolve(arrayBuffer.slice(0)));
    return arrayBuffer.slice(0);
  } catch (error) {
    runtimeResourceCache.delete(resolvedModelPath);
    throw error;
  }
}

async function getParsedModel(modelAsset) {
  const cacheKey = "parsed:" + modelAsset.path;
  const existing = runtimeResourceCache.get(cacheKey);
  if (existing) return await existing;

  const request = (async () => {
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
    loader.setDRACOLoader(dracoLoader);
    loader.setMeshoptDecoder(MeshoptDecoder);
    const resolvedModelPath = resolveRuntimeAssetPath(modelAsset.path);
    const arrayBuffer = await readModelArrayBuffer(resolvedModelPath);

    return await new Promise((resolve, reject) => {
      loader.parse(arrayBuffer, new URL(resolvedModelPath, window.location.href).href, function (gltf) {
        dracoLoader.dispose();
        resolve(gltf);
      }, function (error) {
        dracoLoader.dispose();
        reject(error);
      });
    });
  })();

  runtimeResourceCache.set(cacheKey, request);

  try {
    return await request;
  } catch (error) {
    runtimeResourceCache.delete(cacheKey);
    throw error;
  }
}

export class CostumeShowcase {
  constructor(container, statusNode, overlayNode) {
    this.container = container;
    this.statusNode = statusNode;
    this.overlayNode = overlayNode;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.controls = null;
    this.frameId = 0;
    this.resizeObserver = null;
    this.modelRoot = null;
    this.modelGroup = null;
    this.pedestal = null;
    this.shadowPlane = null;
    this.modelSize = new Vector3(1, 1, 1);
    this.focusBounds = { minY: -1, height: 2.2 };
    this.currentPreset = null;
    this.currentModelAssetPath = null;
    this.targetState = null;
    this.currentState = null;
    this.shadowTexture = createShadowTexture();
    this.pointerModeReset = null;
  }

  async init() {
    this.showLoading("模型加载中...");
    this.createStage();
    this.start();
    this.hideLoading();
  }

  createStage() {
    this.container.innerHTML = "";
    this.scene = new Scene();

    this.camera = new PerspectiveCamera(28, this.getAspect(), 0.1, 80);
    this.camera.position.set(0.8, 1.55, 7.4);

    this.renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight, false);
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.82;
    this.renderer.shadowMap.enabled = true;
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.useLegacyLights = false;
    this.container.appendChild(this.renderer.domElement);

    this.scene.environment = createDarkEnvironmentMap(this.renderer);

    this.scene.add(new HemisphereLight(0xf5efe4, 0x786d63, 0.8));

    const keyLight = new SpotLight(0xfffbf2, 23.5, 30, Math.PI / 4.8, 0.34, 1.05);
    keyLight.position.set(3.2, 6.6, 5.2);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.00008;
    this.scene.add(keyLight);

    const rimLight = new SpotLight(0xe6f0f2, 10.1, 24, Math.PI / 5.4, 0.42, 0.9);
    rimLight.position.set(-4.8, 4.8, -4.8);
    this.scene.add(rimLight);

    const warmFill = new SpotLight(0xf1e7d8, 8.4, 22, Math.PI / 4.9, 0.45, 0.9);
    warmFill.position.set(-2.2, 3.1, 6.6);
    this.scene.add(warmFill);

    const backFill = new SpotLight(0xdfe8ea, 7.2, 22, Math.PI / 5.1, 0.45, 0.95);
    backFill.position.set(1.6, 3.8, -6.4);
    this.scene.add(backFill);

    this.pedestal = new Mesh(
      new CylinderGeometry(1.96, 2.16, 0.48, 72, 1, false),
      new MeshPhysicalMaterial({
        color: new Color("#efe4d2"),
        roughness: 0.68,
        metalness: 0.04,
        clearcoat: 0.08,
        clearcoatRoughness: 0.72,
        envMapIntensity: 0.38
      })
    );
    this.pedestal.receiveShadow = true;
    this.scene.add(this.pedestal);

    this.shadowPlane = new Mesh(
      new PlaneGeometry(7.2, 7.2),
      new MeshBasicMaterial({
        map: this.shadowTexture,
        transparent: true,
        opacity: 0.24,
        depthWrite: false
      })
    );
    this.shadowPlane.rotation.x = -Math.PI / 2;
    this.scene.add(this.shadowPlane);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enablePan = true;
    this.controls.autoRotate = false;
    this.controls.dampingFactor = 0.08;
    this.controls.rotateSpeed = 0.7;
    this.controls.zoomSpeed = 0.9;
    this.controls.panSpeed = 0.85;
    this.controls.minPolarAngle = Math.PI * 0.16;
    this.controls.maxPolarAngle = Math.PI * 0.54;
    this.controls.target.set(0, 0.7, 0);
    this.controls.mouseButtons = {
      LEFT: MOUSE.ROTATE,
      MIDDLE: MOUSE.DOLLY,
      RIGHT: null
    };
    this.bindPointerModes();
    this.controls.addEventListener("start", () => {
      this.targetState = null;
    });
    this.controls.update();

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.container);
  }

  bindPointerModes() {
    const canvas = this.renderer.domElement;

    const resetMode = () => {
      this.controls.mouseButtons.LEFT = MOUSE.ROTATE;
    };

    this.pointerModeReset = resetMode;

    canvas.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });

    canvas.addEventListener("pointerdown", (event) => {
      if (event.button === 2) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      if (event.button !== 0) return;

      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const isRotateZone = x >= 0.22 && x <= 0.78 && y >= 0.12 && y <= 0.88;

      this.controls.mouseButtons.LEFT = isRotateZone ? MOUSE.ROTATE : MOUSE.PAN;
    }, true);

    window.addEventListener("pointerup", resetMode);
    window.addEventListener("pointercancel", resetMode);
  }

  clearModel() {
    if (this.modelGroup) {
      this.scene?.remove(this.modelGroup);
    }

    this.modelRoot = null;
    this.modelGroup = null;
    this.currentModelAssetPath = null;
  }

  ensureCanvasAttached() {
    if (!this.renderer?.domElement) return;
    if (this.renderer.domElement.parentNode === this.container) return;
    this.container.innerHTML = "";
    this.container.appendChild(this.renderer.domElement);
  }

  async loadModel(modelAsset) {
    this.setStatus("模型加载中...");

    const gltf = await getParsedModel(modelAsset);
    this.setStatus("模型已缓存，正在整理材质...");

    this.clearModel();
    this.modelRoot = cloneSkinnedScene(gltf.scene);
    this.modelGroup = new Group();
    this.modelGroup.rotation.y = modelAsset.rotationY || 0;
    this.modelGroup.add(this.modelRoot);
    this.scene.add(this.modelGroup);
    this.currentModelAssetPath = modelAsset.path;
    if (typeof window !== "undefined") {
      window.__costumeShowcaseCurrentModel = modelAsset.path;
    }

    this.prepareModel(modelAsset.scale || 1);
    this.setStatus("模型已就绪，可自由拖拽与缩放。");
  }

  async showPreset(preset, immediate = false) {
    if (!preset?.modelAsset?.path) {
      throw new Error("Missing model asset");
    }

    this.ensureCanvasAttached();

    if (this.currentModelAssetPath !== preset.modelAsset.path) {
      this.showLoading("模型加载中...");
      await this.loadModel(preset.modelAsset);
      this.hideLoading();
    }

    this.applyPreset(preset, immediate);
  }

  prepareModel(scale) {
    const sourceBox = new Box3().setFromObject(this.modelRoot);
    const center = new Vector3();
    sourceBox.getCenter(center);
    sourceBox.getSize(this.modelSize);

    this.modelRoot.position.sub(center);
    this.modelGroup.scale.setScalar(scale);

    const box = new Box3().setFromObject(this.modelGroup);
    const size = new Vector3();
    box.getSize(size);

    this.modelGroup.position.y = -box.min.y - 1.45;
    this.focusBounds.minY = box.min.y + this.modelGroup.position.y;
    this.focusBounds.height = size.y;

    this.pedestal.position.y = this.focusBounds.minY - 0.32;
    this.shadowPlane.position.y = this.focusBounds.minY + 0.02;

    const maxAnisotropy = Math.min(6, this.renderer.capabilities.getMaxAnisotropy());

    this.modelGroup.traverse((child) => {
      if (!child.isMesh || !child.material) return;

      child.castShadow = true;
      child.receiveShadow = true;

      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        if (material.map) {
          material.map.colorSpace = SRGBColorSpace;
          material.map.anisotropy = maxAnisotropy;
        }
        if (material.normalMap) {
          material.normalMap.anisotropy = maxAnisotropy;
          if (material.normalScale) {
            material.normalScale.set(1.08, 1.08);
          }
        }
        if (material.roughnessMap) {
          material.roughnessMap.anisotropy = maxAnisotropy;
        }
        if (material.metalnessMap) {
          material.metalnessMap.anisotropy = maxAnisotropy;
        }
        material.side = DoubleSide;
        material.envMapIntensity = Math.max(material.envMapIntensity || 0, 0.42);
        if (typeof material.roughness === "number") material.roughness = Math.min(1, material.roughness + 0.1);
        if (typeof material.metalness === "number") material.metalness = Math.max(0, material.metalness * 0.68);
        material.needsUpdate = true;
      });
    });
  }

  applyPreset(preset, immediate = false) {
    if (!preset) return;
    this.currentPreset = preset;

    const target = new Vector3(
      0,
      this.focusBounds.minY + this.focusBounds.height * preset.camera.targetY,
      0
    );

    const distance = Math.max(this.focusBounds.height * preset.camera.distanceMultiplier + 0.9, 3.2);
    const horizontalRadius = distance * Math.cos(preset.camera.elevation);
    const nextCamera = new Vector3(
      Math.sin(preset.camera.azimuth) * horizontalRadius,
      target.y + Math.sin(preset.camera.elevation) * distance,
      Math.cos(preset.camera.azimuth) * horizontalRadius
    );

    this.targetState = {
      camera: nextCamera,
      target,
      fov: preset.camera.fov
    };

    if (immediate || !this.currentState) {
      this.currentState = {
        camera: nextCamera.clone(),
        target: target.clone(),
        fov: preset.camera.fov
      };
      this.syncCamera();
    }
  }

  syncCamera() {
    if (!this.currentState) return;
    this.camera.position.copy(this.currentState.camera);
    this.camera.fov = this.currentState.fov;
    this.camera.updateProjectionMatrix();
    this.controls.target.copy(this.currentState.target);

    const distance = this.camera.position.distanceTo(this.controls.target);
    this.controls.minDistance = Math.max(distance * 0.28, 0.78);
    this.controls.maxDistance = Math.max(distance * 1.55, 4.2);
    this.controls.update();
  }

  handleResize() {
    if (!this.renderer || !this.camera) return;
    this.camera.aspect = this.getAspect();
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight, false);
  }

  update() {
    if (this.targetState && this.currentState) {
      this.currentState.camera.lerp(this.targetState.camera, 0.09);
      this.currentState.target.lerp(this.targetState.target, 0.09);
      this.currentState.fov = MathUtils.lerp(this.currentState.fov, this.targetState.fov, 0.09);

      if (
        this.currentState.camera.distanceTo(this.targetState.camera) < 0.01 &&
        this.currentState.target.distanceTo(this.targetState.target) < 0.01 &&
        Math.abs(this.currentState.fov - this.targetState.fov) < 0.02
      ) {
        this.currentState.camera.copy(this.targetState.camera);
        this.currentState.target.copy(this.targetState.target);
        this.currentState.fov = this.targetState.fov;
        this.targetState = null;
      }

      this.syncCamera();
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  start() {
    const tick = () => {
      this.frameId = window.requestAnimationFrame(tick);
      this.update();
    };
    tick();
  }

  destroy() {
    window.cancelAnimationFrame(this.frameId);
    this.resizeObserver?.disconnect();
    if (this.pointerModeReset) {
      window.removeEventListener("pointerup", this.pointerModeReset);
      window.removeEventListener("pointercancel", this.pointerModeReset);
    }
    this.controls?.dispose();
    this.clearModel();
    this.shadowTexture?.dispose();
    this.renderer?.dispose();
  }

  setStatus(text) {
    if (this.statusNode) this.statusNode.textContent = text;
  }

  showLoading(text) {
    if (this.statusNode && text) this.statusNode.textContent = text;
    this.overlayNode?.classList.remove("is-hidden");
  }

  hideLoading() {
    this.overlayNode?.classList.add("is-hidden");
  }

  getAspect() {
    return Math.max(this.container.clientWidth, 320) / Math.max(this.container.clientHeight, 420);
  }

  static async warmup(modelAssets) {
    const assets = Array.isArray(modelAssets) ? modelAssets : [modelAssets];
    const uniquePaths = [...new Set(
      assets
        .filter((asset) => asset && asset.path)
        .map((asset) => asset.path)
    )];

    await Promise.all(uniquePaths.map((modelPath) => readModelArrayBuffer(modelPath)));
  }
}
