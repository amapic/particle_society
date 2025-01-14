import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
// import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Events } from '../events';

import store from '../store';

import FBO from './FBO';

import simVertex from './shaders/simulation.vert';
import simFragment from './shaders/simulation.frag';
import particlesVertex from './shaders/particles.vert';
import particlesFragment from './shaders/particles.frag';
import fullScreenVertex from './shaders/fullscreen.vert';
import fullScreenFragment from './shaders/fullscreen.frag';

import { getRandomSpherePoint } from '../utils';

import GUI from '../gui';

export default new class {
  constructor() {
    this.renderer = new THREE.WebGL1Renderer({ 
      antialias: true, 
      alpha: true, 
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(store.bounds.ww, store.bounds.wh);
    this.renderer.setClearColor(0x000000, 0);

    this.camera = new THREE.PerspectiveCamera(
      45,
      store.bounds.ww / store.bounds.wh,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 4);

    this.scene = new THREE.Scene();

    this.canvas = null;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    this.clock = new THREE.Clock();
    this.time = null;

    this.mouse = new THREE.Vector2(0, 0);
    this.mouseTarget = new THREE.Vector2(0, 0);

    this.zoomDisplay = document.createElement('div');
    this.zoomDisplay.style.position = 'fixed';
    this.zoomDisplay.style.top = '10px';
    this.zoomDisplay.style.left = '10px';
    this.zoomDisplay.style.color = 'white';
    this.zoomDisplay.style.fontFamily = 'monospace';
    // document.body.appendChild(this.zoomDisplay);

    this.mouseDisplay = document.createElement('div');
    this.mouseDisplay.style.position = 'fixed';
    this.mouseDisplay.style.top = '40px';
    this.mouseDisplay.style.left = '10px';
    this.mouseDisplay.style.color = 'white';
    this.mouseDisplay.style.fontFamily = 'monospace';
    this.mouseDisplay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    this.mouseDisplay.style.padding = '5px 10px';
    this.mouseDisplay.style.borderRadius = '3px';
    // document.body.appendChild(this.mouseDisplay);

    // Configuration du zoom
    this.zoomConfig = {
        min: 1,
        max: 4,
        current: 4,
        smooth: 0.1
    };
    
    // Initialiser la caméra avec le zoom de départ
    this.camera.position.z = this.zoomConfig.current;
    
    // Écouter le scroll
    this.setupScroll();

    this.mouseRotation = {
      current: { x: 0, y: 0 },
      target: { x: 0, y: 0 }
    };

    // Configuration pour le mouvement de la caméra
    this.cameraConfig = {
      basePosition: new THREE.Vector3(0, 0, 4), // Position initiale
      movementRange: 0.5, // Amplitude du mouvement
      smoothness: 0.1    // Vitesse de transition
    };

    this.init();
  }

  init() {
    this.addCanvas();
    this.addEvents();
    this.setGui();
    this.createFBO();
    this.createScreenQuad();
  }

  addCanvas() {
    this.canvas = this.renderer.domElement;
    this.canvas.classList.add('webgl');
    document.body.appendChild(this.canvas);
  }

  addEvents() {
    Events.on('tick', this.render.bind(this));
    Events.on('resize', this.resize.bind(this));
    
    window.addEventListener('mousemove', (e) => {
      this.mouseTarget.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouseTarget.y = -(e.clientY / window.innerHeight) * 2 + 1;

      this.mouseRotation.current.x = this.lerp(
        this.mouseRotation.current.x,
        e.clientX / window.innerWidth,
        0.3
      );
      this.mouseRotation.current.y = this.lerp(
        this.mouseRotation.current.y,
        e.clientY / window.innerHeight,
        0.3
      );
    });
  }

  setGui() {
    GUI.hide();
    
    this.tweaks = {
      pointSize: 3,
      speed: 0.3,
      curlFreq: 0.25,
      opacity: 0.8,
      numBranches: 3,
      branchDepth: 0.6,
      sharpness: 100.0,
      slideSpeedX: 0,
      slideSpeedY: 0,
      zoom: 0
    };

    GUI.add(this.tweaks, 'pointSize', 1, 3, 0.1)
       .name('particle size')
       .onChange(() => this.renderMaterial.uniforms.uPointSize.value = this.tweaks.pointSize);

    GUI.add(this.tweaks, 'speed', 0.0, 1, 0.001)
       .onChange(() => this.simMaterial.uniforms.uSpeed.value = this.tweaks.speed);

    GUI.add(this.tweaks, 'curlFreq', 0, 0.6, 0.01)
       .name('noise frequency')
       .onChange(() => this.simMaterial.uniforms.uCurlFreq.value = this.tweaks.curlFreq);

    GUI.add(this.tweaks, 'opacity', 0.1, 1.0, 0.01)
       .onChange(() => this.renderMaterial.uniforms.uOpacity.value = this.tweaks.opacity);

    GUI.add(this.tweaks, 'numBranches', 3, 12, 1)
       .name('Star Branches')
       .onChange(() => {
           this.simMaterial.uniforms.uNumBranches.value = this.tweaks.numBranches;
       });
       
    GUI.add(this.tweaks, 'branchDepth', 0, 1, 0.01)
       .name('Branch Depth')
       .onChange(() => {
           this.simMaterial.uniforms.uBranchDepth.value = this.tweaks.branchDepth;
       });

    GUI.add(this.tweaks, 'sharpness', 0.5, 100, 0.1)
       .name('Point Sharpness')
       .onChange(() => {
           this.simMaterial.uniforms.uSharpness.value = this.tweaks.sharpness;
       });

    GUI.add(this.tweaks, 'slideSpeedX', 0, 2, 0.1)
       .name('Slide Speed X')
       .onChange(() => {
           this.simMaterial.uniforms.uSlideSpeedX.value = this.tweaks.slideSpeedX;
       });
       
    GUI.add(this.tweaks, 'slideSpeedY', 0, 2, 0.1)
       .name('Slide Speed Y')
       .onChange(() => {
           this.simMaterial.uniforms.uSlideSpeedY.value = this.tweaks.slideSpeedY;
       });

    const zoomController = GUI.add(this.tweaks, 'zoom')
        .name('Camera Zoom')
        .listen();
  }

  createFBO() {
    // width and height of FBO
    const width = 64;
    const height = 64;

    // Populate a Float32Array of random positions
    let length = width * height * 3;
    let data = new Float32Array(length);
    for (let i = 0; i < length; i += 3) {
      // Random positions inside a sphere
      const point = getRandomSpherePoint();
      data[i + 0] = point.x;
      data[i + 1] = point.y;
      data[i + 2] = point.z;      

      // // Replaced with this if you want 
      // // random positions inside a cube
      // data[i + 0] = Math.random() - 0.5;
      // data[i + 1] = Math.random() - 0.5;
      // data[i + 2] = Math.random() - 0.5;      
    }

    // Convert the data to a FloatTexture
    const positions = new THREE.DataTexture(data, width, height, THREE.RGBFormat, THREE.FloatType);
    positions.needsUpdate = true;

    // Simulation shader material used to update the particles' positions
    this.simMaterial = new THREE.ShaderMaterial({
      vertexShader: simVertex,
      fragmentShader: simFragment,
      uniforms: {
        positions: { value: positions },
        uTime: { value: 0 },
        uSpeed: { value: this.tweaks.speed },
        uCurlFreq: { value: this.tweaks.curlFreq },
        uMouse: { value: this.mouse },
        uNumBranches: { value: this.tweaks.numBranches },
        uBranchDepth: { value: this.tweaks.branchDepth },
        uSharpness: { value: 2.0 },
        uSlideSpeedX: { value: this.tweaks.slideSpeedX },
        uSlideSpeedY: { value: this.tweaks.slideSpeedY }
      },
    });

    // Render shader material to display the particles on screen
    // the positions uniform will be set after the this.fbo.update() call
    this.renderMaterial = new THREE.ShaderMaterial({
      vertexShader: particlesVertex,
      fragmentShader: particlesFragment,
      uniforms: {
        positions: { value: null },
        uTime: { value: 0 },
        uPointSize: { value: this.tweaks.pointSize },
        uOpacity: { value: this.tweaks.opacity },
        uMouse: { value: this.mouse }
      },
      transparent: true,
      blending: THREE.AdditiveBlending
    });

    // Initialize the FBO
    this.fbo = new FBO(width, height, this.renderer, this.simMaterial, this.renderMaterial);
    // Add the particles to the scene
    this.scene.add(this.fbo.particles);
  }

  createScreenQuad() {
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader: fullScreenVertex,
      fragmentShader: fullScreenFragment,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(store.bounds.ww, store.bounds.wh) },
		uMouse: { value: this.mouse }
      },
      depthTest: false,
      blending: THREE.AdditiveBlending      
    });

    this.fullScreenQuad = new THREE.Mesh(geometry, material);
    // this.fullScreenQuad.rotation.x = Math.PI / 2;
    this.scene.add(this.fullScreenQuad);
  }

  resize() {
    let width = store.bounds.ww;
    let height = store.bounds.wh;

    this.camera.aspect = width / height;
    this.renderer.setSize(width, height);

    this.camera.updateProjectionMatrix();

    this.fullScreenQuad.material.uniforms.uResolution.value.x = store.bounds.ww;
    this.fullScreenQuad.material.uniforms.uResolution.value.y = store.bounds.wh;
  }

  setupScroll() {
    // Calculer la hauteur totale scrollable
    const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
    
    // window.addEventListener('scroll', () => {
    //     // Convertir le scroll en valeur de zoom
    //     const scrollRatio = window.pageYOffset / totalScroll;
    //     const targetZoom = this.zoomConfig.min + 
    //         (this.zoomConfig.max - this.zoomConfig.min) * scrollRatio;
            
    //     // Mettre à jour la cible de zoom
    //     this.zoomConfig.current = targetZoom;
    // });
  }

  lerp(start, end, t) {
    return start * (1 - t) + end * t;
  }

  render() {
    this.controls.update();
    this.time = this.clock.getElapsedTime();
    this.fbo.update(this.time);
    this.fullScreenQuad.material.uniforms.uTime.value = this.time;

    // Mise à jour de la position de la caméra
    const targetX = this.mouseTarget.x * this.cameraConfig.movementRange;
    const targetY = this.mouseTarget.y * this.cameraConfig.movementRange;

    this.camera.position.x += (targetX - this.camera.position.x) * this.cameraConfig.smoothness;
    this.camera.position.y += (targetY - this.camera.position.y) * this.cameraConfig.smoothness;

    // Faire regarder la caméra vers le centre
    this.camera.lookAt(0, 0, 0);

    this.mouse.lerp(this.mouseTarget, 0.1);
    this.simMaterial.uniforms.uMouse.value = this.mouse;

    this.tweaks.zoom = this.camera.position.z;

    const zoom = this.camera.position.z.toFixed(2);
    this.zoomDisplay.textContent = `Zoom: ${zoom}`;

    const mouseX = this.mouse.x.toFixed(3);
    const mouseY = this.mouse.y.toFixed(3);
    this.mouseDisplay.textContent = `Mouse: (${mouseX}, ${mouseY})`;

    // Appliquer le zoom avec smoothing
    const currentZ = this.camera.position.z;
    const targetZ = this.zoomConfig.current;
    this.camera.position.z += (targetZ - currentZ) * this.zoomConfig.smooth;

    // Calculer la rotation cible
    this.mouseRotation.target.x = -this.lerp(this.mouseRotation.current.y, 0, 0.3);
    this.mouseRotation.target.y = -this.lerp(this.mouseRotation.current.x, 0, 0.3);

    // Appliquer la rotation au material
    if (this.simMaterial) {
      this.simMaterial.uniforms.uRotation = this.simMaterial.uniforms.uRotation || { value: new THREE.Vector2() };
      this.simMaterial.uniforms.uRotation.value.x = -this.mouseRotation.target.x * 10;
      this.simMaterial.uniforms.uRotation.value.y = -this.mouseRotation.target.y * 10;
    }
//  console.log(this.simMaterial.uniforms.uRotation.value);
    this.renderer.render(this.scene, this.camera);
  }
}