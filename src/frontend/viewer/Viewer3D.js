import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Viewer3D - High-End Multi-Garment 3D Fitting Engine
 * Composites Admin Garment Background Images (e.g. Green Windbreaker) + Customer Artwork Canvases
 * into realistic 3D textures.
 */
export class Viewer3D {
  constructor(modalContainerId) {
    this.containerId = modalContainerId;
    this.container = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.gltfModel = null;
    this.gltfLoader = new GLTFLoader();
    this.isInitialized = false;

    this.bodyMesh = null;
    this.collarMesh = null;
    this.garmentType = 'windbreaker';
  }

  init(glbUrl, garmentType = 'windbreaker') {
    this.container = document.getElementById(this.containerId);
    if (!this.container) return;

    this.garmentType = garmentType || 'windbreaker';

    const width = this.container.clientWidth || 700;
    const height = this.container.clientHeight || 480;

    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.remove();
    }

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f172a); // Dark slate studio background

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 3.8);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // 4. Orbit Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // 5. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.25);
    this.scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.95);
    mainLight.position.set(3, 6, 5);
    mainLight.castShadow = true;
    this.scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xbfdbfe, 0.6);
    fillLight.position.set(-4, -1, -3);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffedd5, 0.4);
    rimLight.position.set(0, 4, -5);
    this.scene.add(rimLight);

    this.isInitialized = true;

    // Load .GLB Model or Build 3D Garment Mesh by Type (Windbreaker, Hoodie, T-Shirt)
    this.loadGlbModel(glbUrl, this.garmentType);

    this.animate();
  }

  /**
   * Loads a real .glb 3D Garment Model File or builds a dynamic procedural 3D Garment Mesh by type
   */
  loadGlbModel(glbUrl, garmentType = 'windbreaker', onLoaded = null) {
    if (!glbUrl) {
      this.createGarmentMeshByType(garmentType);
      if (onLoaded) onLoaded();
      return;
    }

    console.log(`📦 Loading GLTF/GLB 3D Garment Model from: ${glbUrl}`);

    this.gltfLoader.load(
      glbUrl,
      (gltf) => {
        if (this.gltfModel) this.scene.remove(this.gltfModel);

        this.gltfModel = gltf.scene;

        // Auto-center & Scale .glb model
        const box = new THREE.Box3().setFromObject(this.gltfModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        this.gltfModel.position.x += (this.gltfModel.position.x - center.x);
        this.gltfModel.position.y += (this.gltfModel.position.y - center.y);
        this.gltfModel.position.z += (this.gltfModel.position.z - center.z);

        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
          const scale = 2.2 / maxDim;
          this.gltfModel.scale.set(scale, scale, scale);
        }

        this.scene.add(this.gltfModel);
        console.log('✅ Real 3D Garment Model (.GLB) loaded successfully!');
        if (onLoaded) onLoaded();
      },
      undefined,
      (error) => {
        console.warn(`⚠️ Could not load .GLB file, building 3D Garment mesh for [${garmentType}]:`, error);
        this.createGarmentMeshByType(garmentType);
        if (onLoaded) onLoaded();
      }
    );
  }

  /**
   * Builds dynamic 3D Garment Meshes by item category type
   */
  createGarmentMeshByType(type) {
    if (type === 'windbreaker' || type === 'jacket') {
      this.createWindbreakerJacketMesh();
    } else if (type === 'hoodie') {
      this.createHoodieMesh();
    } else {
      this.createSeamless3DShirt();
    }
  }

  /**
   * Builds a 3D Windbreaker Jacket Mesh (바람막이 자켓)
   */
  createWindbreakerJacketMesh() {
    if (this.gltfModel) this.scene.remove(this.gltfModel);

    this.gltfModel = new THREE.Group();

    const jacketShape = new THREE.Shape();
    jacketShape.moveTo(-0.30, 1.35);
    jacketShape.lineTo(0.30, 1.35);
    jacketShape.quadraticCurveTo(0.68, 1.28, 0.98, 1.12);
    jacketShape.quadraticCurveTo(1.48, 0.50, 1.82, -0.35);
    jacketShape.lineTo(1.52, -0.45);
    jacketShape.quadraticCurveTo(1.15, 0.25, 0.78, 0.28);
    jacketShape.quadraticCurveTo(0.80, -0.40, 0.80, -1.18);
    jacketShape.quadraticCurveTo(0, -1.25, -0.80, -1.18);
    jacketShape.quadraticCurveTo(-0.80, -0.40, -0.78, 0.28);
    jacketShape.quadraticCurveTo(-1.15, 0.25, -1.52, -0.45);
    jacketShape.lineTo(-1.82, -0.35);
    jacketShape.quadraticCurveTo(-1.48, 0.50, -0.98, 1.12);
    jacketShape.quadraticCurveTo(-0.68, 1.28, -0.30, 1.35);
    jacketShape.closePath();

    const extrudeSettings = {
      curveSegments: 64,
      steps: 12,
      depth: 0.30,
      bevelEnabled: true,
      bevelThickness: 0.14,
      bevelSize: 0.12,
      bevelSegments: 20
    };

    const jacketGeo = new THREE.ExtrudeGeometry(jacketShape, extrudeSettings);
    jacketGeo.center();
    jacketGeo.computeVertexNormals();

    const nylonMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.45,
      metalness: 0.08,
      side: THREE.DoubleSide
    });

    this.bodyMesh = new THREE.Mesh(jacketGeo, nylonMaterial);
    this.gltfModel.add(this.bodyMesh);

    const collarGeo = new THREE.CylinderGeometry(0.32, 0.35, 0.22, 32, 1, true);
    const collarMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4, side: THREE.DoubleSide });
    this.collarMesh = new THREE.Mesh(collarGeo, collarMat);
    this.collarMesh.position.set(0, 1.32, 0);
    this.collarMesh.scale.set(1.1, 1.0, 0.5);
    this.gltfModel.add(this.collarMesh);

    this.scene.add(this.gltfModel);
  }

  createHoodieMesh() {
    this.createWindbreakerJacketMesh();
  }

  createSeamless3DShirt() {
    if (this.gltfModel) this.scene.remove(this.gltfModel);

    this.gltfModel = new THREE.Group();

    const shirtShape = new THREE.Shape();
    shirtShape.moveTo(-0.36, 1.25);
    shirtShape.quadraticCurveTo(0, 1.05, 0.36, 1.25);
    shirtShape.quadraticCurveTo(0.68, 1.22, 0.98, 1.08);
    shirtShape.quadraticCurveTo(1.28, 0.75, 1.48, 0.38);
    shirtShape.quadraticCurveTo(1.30, 0.22, 1.08, 0.08);
    shirtShape.quadraticCurveTo(0.86, 0.35, 0.78, 0.28);
    shirtShape.quadraticCurveTo(0.80, -0.40, 0.78, -1.10);
    shirtShape.quadraticCurveTo(0, -1.22, -0.78, -1.10);
    shirtShape.quadraticCurveTo(-0.80, -0.40, -0.78, 0.28);
    shirtShape.quadraticCurveTo(-0.86, 0.35, -1.08, 0.08);
    shirtShape.quadraticCurveTo(-1.30, 0.22, -1.48, 0.38);
    shirtShape.quadraticCurveTo(-1.28, 0.75, -0.98, 1.08);
    shirtShape.quadraticCurveTo(-0.68, 1.22, -0.36, 1.25);
    shirtShape.closePath();

    const extrudeSettings = {
      curveSegments: 64,
      steps: 12,
      depth: 0.28,
      bevelEnabled: true,
      bevelThickness: 0.16,
      bevelSize: 0.14,
      bevelOffset: 0,
      bevelSegments: 24
    };

    const shirtGeo = new THREE.ExtrudeGeometry(shirtShape, extrudeSettings);
    shirtGeo.center();
    shirtGeo.computeVertexNormals();

    const fabricMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.85,
      metalness: 0.0,
      side: THREE.DoubleSide
    });

    this.bodyMesh = new THREE.Mesh(shirtGeo, fabricMaterial);
    this.gltfModel.add(this.bodyMesh);

    const collarGeo = new THREE.TorusGeometry(0.38, 0.05, 24, 64);
    const collarMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.82 });
    this.collarMesh = new THREE.Mesh(collarGeo, collarMat);
    this.collarMesh.position.set(0, 1.15, 0.02);
    this.collarMesh.rotation.x = Math.PI / 2.3;
    this.gltfModel.add(this.collarMesh);

    this.scene.add(this.gltfModel);
  }

  setCameraPreset(preset) {
    if (!this.camera || !this.controls) return;
    switch (preset) {
      case 'front': this.camera.position.set(0, 0, 3.8); break;
      case 'back': this.camera.position.set(0, 0, -3.8); break;
      case 'left': this.camera.position.set(-3.8, 0, 0); break;
      case 'right': this.camera.position.set(3.8, 0, 0); break;
    }
    this.controls.update();
  }

  /**
   * Multi-Surface Texture Composite & UV Mapping
   * Composites Admin Garment Background Image (Green Windbreaker) + Customer Artwork Canvases!
   */
  updateMultiSurfaceTextures(surfacesMap) {
    if (!surfacesMap) return;

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Fill white base
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1024, 1024);

    const frontSurf = surfacesMap.front || {};
    const backSurf = surfacesMap.back || {};

    let loadedCount = 0;
    // Front Garment, Front Artwork, Back Garment, Back Artwork
    const totalToLoad = 4;

    const applyTexture = () => {
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;

      if (this.bodyMesh) {
        this.bodyMesh.material.map = texture;
        this.bodyMesh.material.needsUpdate = true;
      } else if (this.gltfModel) {
        this.gltfModel.traverse((child) => {
          if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
              map: texture,
              roughness: this.garmentType === 'windbreaker' ? 0.45 : 0.85,
              metalness: this.garmentType === 'windbreaker' ? 0.08 : 0.0,
              side: THREE.DoubleSide
            });
            child.material.needsUpdate = true;
          }
        });
      }
    };

    const checkFinish = () => {
      loadedCount++;
      if (loadedCount >= totalToLoad) {
        applyTexture();
      }
    };

    // 1. Draw Front Admin Garment Mockup Image (Green Windbreaker)
    if (frontSurf.bgOverlay && !frontSurf.bgOverlay.startsWith('file://')) {
      const frontGarmentImg = new Image();
      frontGarmentImg.crossOrigin = 'anonymous';
      frontGarmentImg.onload = () => {
        ctx.drawImage(frontGarmentImg, 0, 0, 512, 1024);
        checkFinish();
      };
      frontGarmentImg.onerror = () => checkFinish();
      frontGarmentImg.src = frontSurf.bgOverlay;
    } else {
      checkFinish();
    }

    // 2. Draw Front Customer Artwork Canvas
    if (frontSurf.artworkDataUrl) {
      const imgFront = new Image();
      imgFront.onload = () => {
        ctx.drawImage(imgFront, 0, 0, 512, 1024);
        checkFinish();
      };
      imgFront.onerror = () => checkFinish();
      imgFront.src = frontSurf.artworkDataUrl;
    } else {
      checkFinish();
    }

    // 3. Draw Back Admin Garment Mockup Image
    if (backSurf.bgOverlay && !backSurf.bgOverlay.startsWith('file://')) {
      const backGarmentImg = new Image();
      backGarmentImg.crossOrigin = 'anonymous';
      backGarmentImg.onload = () => {
        ctx.drawImage(backGarmentImg, 512, 0, 512, 1024);
        checkFinish();
      };
      backGarmentImg.onerror = () => checkFinish();
      backGarmentImg.src = backSurf.bgOverlay;
    } else {
      checkFinish();
    }

    // 4. Draw Back Customer Artwork Canvas
    if (backSurf.artworkDataUrl) {
      const imgBack = new Image();
      imgBack.onload = () => {
        ctx.drawImage(imgBack, 512, 0, 512, 1024);
        checkFinish();
      };
      imgBack.onerror = () => checkFinish();
      imgBack.src = backSurf.artworkDataUrl;
    } else {
      checkFinish();
    }
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    if (this.controls) {
      this.controls.update();
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
