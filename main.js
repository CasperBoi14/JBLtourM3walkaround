import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// ---- Smooth Scroll (Lenis) ----
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  direction: 'vertical',
  gestureDirection: 'vertical',
  smooth: true,
  mouseMultiplier: 1,
  smoothTouch: false,
  touchMultiplier: 2,
  infinite: false,
})

// ---- Auto-scroll Logic ----
let isAutoScrolling = false;
const autoScrollBtn = document.querySelector('.autoscroll-btn');

autoScrollBtn.addEventListener('click', () => {
  isAutoScrolling = !isAutoScrolling;
  autoScrollBtn.textContent = isAutoScrolling ? "Stop Auto-scroll" : "Auto-scroll";
});

function raf(time) {
  lenis.raf(time);
  
  if (isAutoScrolling) {
    const cards = document.querySelectorAll('.card');
    let minDistance = Infinity;
    const viewportCenter = window.innerHeight / 2;
    
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.top + rect.height / 2;
      const distance = Math.abs(viewportCenter - cardCenter);
      if (distance < minDistance) {
        minDistance = distance;
      }
    });
    
    // Calculate speed based on distance to nearest card
    let speed = 12; // Max speed
    if (minDistance < 600) {
      // Slow down to a minimum speed when near a card
      speed = Math.max(2.5, 12 * (minDistance / 600));
    }
    
    window.scrollBy(0, speed);
    
    // Stop if we hit the bottom
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 5) {
      isAutoScrolling = false;
      autoScrollBtn.textContent = "Auto-scroll";
    }
  }

  requestAnimationFrame(raf)
}
requestAnimationFrame(raf)

// ---- Three.js Setup ----
const canvas = document.querySelector('#webgl');
const scene = new THREE.Scene();

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100);
camera.position.z = 8;
scene.add(camera);

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true,
  antialias: true
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Improved Rendering settings for realism
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// ---- Environment and Lighting Setup ----
const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

// Soft ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

// Key Light - main source of illumination
const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
keyLight.position.set(5, 5, 5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;
keyLight.shadow.bias = -0.0001;
scene.add(keyLight);

// Fill Light - softens the shadows on the opposite side
const fillLight = new THREE.DirectionalLight(0xe0e7ff, 1.0);
fillLight.position.set(-5, 0, -5);
scene.add(fillLight);

// Rim Light - highlights the edges for a premium look
const rimLight = new THREE.SpotLight(0xffffff, 5);
rimLight.position.set(0, 5, -10);
rimLight.angle = Math.PI / 6;
rimLight.penumbra = 1;
scene.add(rimLight);

// ---- Elegant Floating Audio Waves Background ----
const elementCount = 75; // Less elements for a cleaner, premium look
const backgroundElements = new THREE.Group();
scene.add(backgroundElements);

// Create sleek, premium geometries (Sound wave arcs and sleek discs)
const arcGeometry = new THREE.TorusGeometry(0.3, 0.015, 16, 64, Math.PI * 1.2); 
const discGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.02, 32);
const capsuleGeometry = new THREE.CapsuleGeometry(0.04, 0.15, 4, 16);

// Premium minimalist material
const elementMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x222222, // Very dark, minimalist grey
    metalness: 0.1,
    roughness: 0.8,
    transmission: 0.1,
    thickness: 0.1,
    transparent: true,
    opacity: 0.3,
    clearcoat: 0.2,
    clearcoatRoughness: 0.8
});

for(let i = 0; i < elementCount; i++) {
    const rand = Math.random();
    let mesh;
    
    if (rand < 0.5) {
        mesh = new THREE.Mesh(arcGeometry, elementMaterial); // Sound waves
    } else if (rand < 0.8) {
        mesh = new THREE.Mesh(discGeometry, elementMaterial); // Drivers / Dials
    } else {
        mesh = new THREE.Mesh(capsuleGeometry, elementMaterial); // Equalizer pills
    }

    // Spread them widely
    mesh.position.set(
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 8 - 2
    );

    // Initial organic rotation
    mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    );

    // Randomize scaling for depth effect
    const scale = Math.random() * 0.8 + 0.4;
    mesh.scale.set(scale, scale, scale);

    // Gentle floating animation data (like falling petals)
    mesh.userData = {
        floatSpeed: (Math.random() * 0.005) + 0.002,
        rotX: (Math.random() - 0.5) * 0.005,
        rotY: (Math.random() - 0.5) * 0.005,
        rotZ: (Math.random() - 0.5) * 0.005,
        startY: mesh.position.y
    };

    backgroundElements.add(mesh);
}

// ---- Model Loading ----
let headphoneModel = null;
const loader = new GLTFLoader();

// Keep track of the model group so we can animate it
const modelGroup = new THREE.Group();
scene.add(modelGroup);

const loadingScreen = document.getElementById('loading-screen');
const loadingBar = document.getElementById('loading-bar');
const loadingText = document.getElementById('loading-text');

loader.load(
  './source/jbl-tour-one-m3-black-android-ar-asset.glb',
  (gltf) => {
    headphoneModel = gltf.scene;

    // Initial positioning and rotation to match the reference image closely
    headphoneModel.position.set(1.5, -1.0, 0); // Start on the right, more centered vertically
    headphoneModel.rotation.set(0.2, (Math.PI / 180) * 20, 0); 
    headphoneModel.scale.set(15, 15, 15); // Start a bit bigger, but keep fully on screen

    // Enhance materials and apply shadows
    headphoneModel.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
                child.material.color.setHex(0x11131a); // Adjusted deep dark tone
                child.material.envMapIntensity = 1.2;
                if (child.material.roughness !== undefined && child.material.roughness > 0.6) {
                   child.material.roughness = 0.5;
                }
                if (child.material.metalness !== undefined) {
                   child.material.metalness = Math.max(0.2, child.material.metalness);
                }
            }
        }
    });

    modelGroup.add(headphoneModel);

    // Give a slight delay before removing the loader to ensure a smooth transition
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
        // Setup animations after loading
        setupAnimations();
    }, 500);
  },
  (xhr) => {
    if (xhr.lengthComputable) {
        const percentComplete = (xhr.loaded / xhr.total) * 100;
        loadingBar.style.width = percentComplete + '%';
        loadingText.innerText = `Loading ${Math.round(percentComplete)}%`;
    }
  },
  (error) => {
    console.error('Error loading model:', error);
    loadingText.innerText = 'Error loading model';
  }
);

// ---- Resize Handler ----
window.addEventListener('resize', () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// ---- Cursor Sound Wave Effect ----
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let lastWaveTime = 0;

window.addEventListener('mousemove', (event) => {
  if (!headphoneModel) return;

  // Calculate mouse position in normalized device coordinates (-1 to +1)
  mouse.x = (event.clientX / sizes.width) * 2 - 1;
  mouse.y = -(event.clientY / sizes.height) * 2 + 1;

  // Raycast to check if mouse is over model
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(modelGroup, true);

  if (intersects.length > 0) {
    const currentTime = Date.now();
    // Throttle the wave creation (e.g., every 150ms)
    if (currentTime - lastWaveTime > 150) {
      createSoundWave(event.clientX, event.clientY);
      lastWaveTime = currentTime;
    }
  }
});

function createSoundWave(x, y) {
  const wave = document.createElement('div');
  wave.classList.add('cursor-sound-wave');
  wave.style.left = `${x}px`;
  wave.style.top = `${y}px`;
  document.body.appendChild(wave);

  // Clean up the DOM element after animation ends
  setTimeout(() => {
    wave.remove();
  }, 800);
}

// ---- Continuous Auto-Sliding UI Effect ----
const autoSliders = document.querySelectorAll('.sliders input[type="range"]');
autoSliders.forEach((slider, index) => {
    // Give each slider a unique speed, offset, and amplitude
    slider.dataset.speed = (Math.random() * 1.5 + 0.5) * 0.001; 
    slider.dataset.offset = Math.random() * Math.PI * 2;
    slider.dataset.range = parseFloat(slider.max || 100) - parseFloat(slider.min || 0);
});

// ---- Animation Loop ----
const clock = new THREE.Clock();

function tick() {
  const elapsedTime = clock.getElapsedTime();

  // Subtle floating idle animation
  if (modelGroup) {
    modelGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.15;
    modelGroup.rotation.y = Math.sin(elapsedTime * 1) * 0.05;
  }

  // Elegant cascading animation for background elements
  if (backgroundElements) {
    backgroundElements.rotation.y = Math.sin(elapsedTime * 0.1) * 0.2; // soft swaying
    backgroundElements.rotation.x = Math.cos(elapsedTime * 0.1) * 0.1;

    backgroundElements.children.forEach(child => {
        // Tumble gracefully
        child.rotation.x += child.userData.rotX;
        child.rotation.y += child.userData.rotY;
        child.rotation.z += child.userData.rotZ;

        // Fall gracefully downwards, looping up
        child.position.y -= child.userData.floatSpeed;
        if (child.position.y < -8) { // Reset point when they fall too low
            child.position.y = 8;
            child.position.x = (Math.random() - 0.5) * 12;
        }

        // Slight drift horizontally
        child.position.x += Math.sin(elapsedTime * 2 + child.userData.startY) * 0.002;
    });
  }

  // Continuously animate UI sliders gracefully
  autoSliders.forEach(slider => {
    const min = parseFloat(slider.min) || 0;
    const range = parseFloat(slider.dataset.range);
    const speed = parseFloat(slider.dataset.speed);
    const offset = parseFloat(slider.dataset.offset);
    
    // Sine wave motion pattern between 15% and 85% of full range to make it feel natural
    const sineWave = (Math.sin((Date.now() * speed) + offset) + 1) / 2;
    slider.value = min + (range * (0.15 + (sineWave * 0.70))); // Oscillates automatically
  });

  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
}
tick();

// ---- GSAP Scroll Animations ----
gsap.registerPlugin(ScrollTrigger);

function setupAnimations() {
  if (!headphoneModel) return;

  // Timeline for the 3D model path
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".content",
      start: "top top",
      end: "bottom bottom",
      scrub: 1.5, // Smoother scrub
    }
  });

  // Section 2 (Specs - Core Power) - Move to Left
  tl.to(headphoneModel.position, {
    x: -2.0,
    y: -0.7,
    z: 1,
    ease: "power2.inOut"
  }, 0);
  tl.to(headphoneModel.rotation, {
    x: 0,
    y: Math.PI / 1.5,
    z: -0.2,
    ease: "power2.inOut"
  }, 0);
  tl.to(headphoneModel.scale, {
    x: 11,
    y: 11,
    z: 11,
    ease: "power2.inOut"
  }, 0);

  // Section 3 (Spatial) - Move to Right
  tl.to(headphoneModel.position, {
    x: 2.0,
    y: -0.7,
    z: 1.5,
    ease: "power2.inOut"
  });
  tl.to(headphoneModel.rotation, {
    x: -0.1,
    y: -Math.PI / 2.5,
    z: 0.1,
    ease: "power2.inOut"
  }, "<");

  // Section 4 (ANC) - Move to Left
  tl.to(headphoneModel.position, {
    x: -2.0,
    y: -0.7,
    z: 2.0,
    ease: "power2.inOut"
  });
  tl.to(headphoneModel.rotation, {
    x: -0.2,
    y: Math.PI / 2.5,
    z: 0.2,
    ease: "power2.inOut"
  }, "<");

  // Section 5 (Brain) - Move to Right
  tl.to(headphoneModel.position, {
    x: 2.0,
    y: -0.7,
    z: 2.5,
    ease: "power2.inOut"
  });
  tl.to(headphoneModel.rotation, {
    x: -0.1,
    y: -Math.PI / 2.5,
    z: 0.1,
    ease: "power2.inOut"
  }, "<");

  // Section 6 (Battery) - Move to Left
  tl.to(headphoneModel.position, {
    x: -2.0,
    y: -0.7,
    z: 3.0,
    ease: "power2.inOut"
  });
  tl.to(headphoneModel.rotation, {
    x: 0,
    y: Math.PI / 1.5,
    z: -0.2,
    ease: "power2.inOut"
  }, "<");

  // Section 7 (Connection) - Move to Right
  tl.to(headphoneModel.position, {
    x: 2.0,
    y: -0.7,
    z: 3.5,
    ease: "power2.inOut"
  });
  tl.to(headphoneModel.rotation, {
    x: -0.1,
    y: -Math.PI / 2.5,
    z: 0.1,
    ease: "power2.inOut"
  }, "<");

  // Section 8 (EQ Settings) - Center top, tilt to see earcups
  tl.to(headphoneModel.position, {
    x: 0,
    y: 1.5,
    z: 2.5,
    ease: "power2.inOut"
  });
  tl.to(headphoneModel.rotation, {
    x: Math.PI / 2.2,
    y: 0,
    z: Math.PI,
    ease: "power2.inOut"
  }, "<");
  tl.to(headphoneModel.scale, {
    x: 9, 
    y: 9, 
    z: 9,
    ease: "power2.inOut"
  }, "<");

  // Section 9 (End) - Center and scale down to 8
  tl.to(headphoneModel.position, {
    x: 0,
    y: -0.7,
    z: 4,
    ease: "power2.inOut"
  });
  tl.to(headphoneModel.rotation, {
    x: -0.2,
    y: Math.PI * 2,
    z: 0,
    ease: "power2.inOut"
  }, "<");
  tl.to(headphoneModel.scale, {
    x: 8,
    y: 8,
    z: 8,
    ease: "power2.inOut"
  }, "<");

  // Reveal UI Cards
  const cards = document.querySelectorAll('.reveal-up');
  cards.forEach(card => {
    gsap.to(card, {
      scrollTrigger: {
        trigger: card,
        start: "top 85%", // Start when top of card hits 85% of viewport
        toggleActions: "play none none reverse"
      },
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "power3.out"
    });
  });
}