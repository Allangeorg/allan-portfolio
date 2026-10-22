/**
 * hero-3d-background.js
 * 
 * Interactive 3D Cyberspace Background for Allan George Mathew Portfolio
 * 
 * Features:
 * 1. Undulating 3D Cyber Wave Grid: A wireframe landscape gently rippling with multi-octave sine waves.
 * 2. Floating Geometric 3D Polyhedra: Wireframe icosahedrons, octahedrons, and cyber rings drifting in 3D depth.
 * 3. Ambient 3D Constellation Field: Depth-scattered glowing micro-particles drifting continuously.
 * 4. Responsive 3D Mouse Parallax: Camera perspective tracks cursor with physics-based smooth inertia.
 * 5. Lifecycle Optimization: Pauses when scrolled out of viewport via IntersectionObserver.
 * 
 * Powered by Three.js (ES Module from importmap)
 */

import * as THREE from 'three';

(function initHero3DBackground() {
  const container = document.getElementById('hero-3d-bg-container');
  const heroSection = document.getElementById('home');
  if (!container || !heroSection) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Scene, Camera, Renderer
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0D0D0D, 0.028);

  let width = container.clientWidth || window.innerWidth;
  let height = container.clientHeight || 750;

  const camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 1000);
  camera.position.set(0, 4, 30);
  camera.lookAt(0, 0, 0);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
  } catch (err) {
    console.warn('WebGL not available for 3D background:', err);
    return;
  }

  renderer.setSize(width, height, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.inset = '0';
  renderer.domElement.style.pointerEvents = 'none';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.appendChild(renderer.domElement);

  // ---------------------------------------------------------------------------
  // 1. Undulating Cyber Wave Grid (Perspective Wireframe Terrain)
  // ---------------------------------------------------------------------------
  const gridWidth = 90;
  const gridHeight = 55;
  const gridSegmentsX = 44;
  const gridSegmentsY = 28;
  const gridGeometry = new THREE.PlaneGeometry(gridWidth, gridHeight, gridSegmentsX, gridSegmentsY);

  // Store initial vertex coordinates for dynamic wave computation
  const posAttribute = gridGeometry.attributes.position;
  const originalZ = new Float32Array(posAttribute.count);
  for (let i = 0; i < posAttribute.count; i++) {
    originalZ[i] = posAttribute.getZ(i);
  }

  const gridMaterial = new THREE.MeshBasicMaterial({
    color: 0x00FF88,
    wireframe: true,
    transparent: true,
    opacity: 0.18
  });

  const cyberGrid = new THREE.Mesh(gridGeometry, gridMaterial);
  cyberGrid.rotation.x = -Math.PI * 0.44;
  cyberGrid.position.set(0, -9.5, 2);
  scene.add(cyberGrid);

  // ---------------------------------------------------------------------------
  // 2. Floating 3D Geometric Polyhedra (Cyber Data Nodes)
  // ---------------------------------------------------------------------------
  const polyhedraGroup = new THREE.Group();
  scene.add(polyhedraGroup);

  const shapesConfig = [
    { type: 'icosa', radius: 1.8, x: -18, y: 7, z: -4, color: 0x00FF88, speed: 0.8 },
    { type: 'octa',  radius: 1.4, x: 20,  y: 8, z: -2, color: 0x00E5FF, speed: 0.9 },
    { type: 'torus', radius: 1.5, x: -22, y: -2, z: 2,  color: 0x00FF88, speed: 0.7 },
    { type: 'icosa', radius: 1.1, x: 22,  y: -3, z: 3,  color: 0x00E5FF, speed: 1.1 },
    { type: 'octa',  radius: 0.9, x: -12, y: 12, z: -8, color: 0x38B2AC, speed: 0.6 },
    { type: 'torus', radius: 1.0, x: 14,  y: 13, z: -6, color: 0x00FF88, speed: 0.85 },
    { type: 'icosa', radius: 0.8, x: -6,  y: 14, z: -10, color: 0x00E5FF, speed: 1.0 },
    { type: 'octa',  radius: 0.7, x: 7,   y: 14, z: -9, color: 0x00FF88, speed: 0.95 },
  ];

  const floatingMeshes = [];

  shapesConfig.forEach((cfg, idx) => {
    let geom;
    if (cfg.type === 'icosa') {
      geom = new THREE.IcosahedronGeometry(cfg.radius, 0);
    } else if (cfg.type === 'octa') {
      geom = new THREE.OctahedronGeometry(cfg.radius, 0);
    } else {
      geom = new THREE.TorusGeometry(cfg.radius, 0.08, 8, 20);
    }

    const mat = new THREE.MeshBasicMaterial({
      color: cfg.color,
      wireframe: true,
      transparent: true,
      opacity: 0.32
    });

    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(cfg.x, cfg.y, cfg.z);

    // Subtle inner glowing core
    const coreGeom = new THREE.SphereGeometry(cfg.radius * 0.22, 6, 6);
    const coreMat = new THREE.MeshBasicMaterial({
      color: cfg.color,
      transparent: true,
      opacity: 0.65
    });
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    mesh.add(coreMesh);

    polyhedraGroup.add(mesh);

    floatingMeshes.push({
      mesh,
      baseY: cfg.y,
      baseX: cfg.x,
      floatSpeed: cfg.speed * 0.7,
      floatAmp: 0.6 + (idx % 3) * 0.35,
      rotSpeedX: 0.005 + (idx % 4) * 0.003,
      rotSpeedY: 0.007 + (idx % 3) * 0.004,
      rotSpeedZ: 0.003 + (idx % 2) * 0.002,
      phase: idx * 0.9
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Ambient 3D Constellation Particles
  // ---------------------------------------------------------------------------
  const particleCount = 420;
  const particleGeometry = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  const particleColors = new Float32Array(particleCount * 3);
  const particleSpeeds = new Float32Array(particleCount);

  const emerald = new THREE.Color(0x00FF88);
  const cyan = new THREE.Color(0x00E5FF);
  const white = new THREE.Color(0xF3F4F6);

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    particlePositions[i3] = (Math.random() - 0.5) * 85;
    particlePositions[i3 + 1] = (Math.random() - 0.5) * 45;
    particlePositions[i3 + 2] = (Math.random() - 0.5) * 40 - 5;

    // Distribute color accents
    const randColor = Math.random();
    let col = emerald;
    if (randColor > 0.68) col = cyan;
    else if (randColor > 0.9) col = white;

    particleColors[i3] = col.r;
    particleColors[i3 + 1] = col.g;
    particleColors[i3 + 2] = col.b;

    particleSpeeds[i] = 0.06 + Math.random() * 0.12;
  }

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

  // Dynamic circular glowing particle texture
  const pCanvas = document.createElement('canvas');
  pCanvas.width = 32;
  pCanvas.height = 32;
  const pCtx = pCanvas.getContext('2d');
  const gradient = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.35, 'rgba(0, 255, 136, 0.7)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  pCtx.fillStyle = gradient;
  pCtx.fillRect(0, 0, 32, 32);

  const pTexture = new THREE.CanvasTexture(pCanvas);

  const particleMaterial = new THREE.PointsMaterial({
    size: 1.4,
    map: pTexture,
    transparent: true,
    opacity: 0.6,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particleSystem);

  // ---------------------------------------------------------------------------
  // 4. Interactive 3D Mouse Parallax
  // ---------------------------------------------------------------------------
  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

  const onMouseMove = (e) => {
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = -(e.clientY / window.innerHeight) * 2 + 1;
    mouse.targetX = nx;
    mouse.targetY = ny;
  };

  window.addEventListener('mousemove', onMouseMove, { passive: true });

  // ---------------------------------------------------------------------------
  // 5. Responsive Resize Handling
  // ---------------------------------------------------------------------------
  const onResize = () => {
    width = container.clientWidth || window.innerWidth;
    height = container.clientHeight || 750;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };

  window.addEventListener('resize', onResize, { passive: true });

  // ---------------------------------------------------------------------------
  // 6. Smooth Animation Loop & Lifecycle (IntersectionObserver)
  // ---------------------------------------------------------------------------
  let isVisible = true;
  let animationFrameId = null;
  let clock = new THREE.Clock();

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        isVisible = entry.isIntersecting;
        if (isVisible && !animationFrameId) {
          clock.start();
          render();
        }
      });
    },
    { threshold: 0.05 }
  );
  observer.observe(heroSection);

  function render() {
    if (!isVisible) {
      animationFrameId = null;
      return;
    }

    const elapsed = clock.getElapsedTime();

    if (!reducedMotion) {
      // 1. Undulate Cyber Wave Grid
      const pArr = gridGeometry.attributes.position.array;
      for (let i = 0; i < posAttribute.count; i++) {
        const x = posAttribute.getX(i);
        const y = posAttribute.getY(i);
        // Multi-frequency wave synthesis
        const wave =
          Math.sin(x * 0.18 + elapsed * 1.3) * Math.cos(y * 0.22 + elapsed * 0.9) * 1.6 +
          Math.sin((x + y) * 0.12 + elapsed * 1.5) * 0.8;
        pArr[i * 3 + 2] = originalZ[i] + wave;
      }
      gridGeometry.attributes.position.needsUpdate = true;

      // 2. Animate Floating 3D Polyhedra
      floatingMeshes.forEach((item) => {
        item.mesh.rotation.x += item.rotSpeedX;
        item.mesh.rotation.y += item.rotSpeedY;
        item.mesh.rotation.z += item.rotSpeedZ;
        item.mesh.position.y =
          item.baseY + Math.sin(elapsed * item.floatSpeed + item.phase) * item.floatAmp;
        item.mesh.position.x =
          item.baseX + Math.cos(elapsed * item.floatSpeed * 0.7 + item.phase) * 0.35;
      });

      // 3. Ambient Drift of Constellation Particles
      const pPositions = particleGeometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        pPositions[i3 + 1] += particleSpeeds[i] * 0.08;
        // Wrap vertically
        if (pPositions[i3 + 1] > 25) {
          pPositions[i3 + 1] = -25;
        }
      }
      particleGeometry.attributes.position.needsUpdate = true;

      // 4. Smooth Camera Parallax Lerp
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      camera.position.x = mouse.x * 4.5;
      camera.position.y = 4 + mouse.y * 2.8;
      camera.lookAt(0, 0, 0);

      // Subtle group tilts
      polyhedraGroup.rotation.y = mouse.x * 0.12;
      polyhedraGroup.rotation.x = -mouse.y * 0.08;
      cyberGrid.rotation.z = mouse.x * 0.04;
    }

    renderer.render(scene, camera);
    animationFrameId = requestAnimationFrame(render);
  }

  // Smooth entrance fade-in
  container.style.opacity = '0';
  setTimeout(() => {
    container.style.transition = 'opacity 2.2s cubic-bezier(0.16, 1, 0.3, 1)';
    container.style.opacity = '1';
  }, 300);

  render();
})();
