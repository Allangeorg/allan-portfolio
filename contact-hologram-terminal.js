/**
 * contact-hologram-terminal.js
 * 
 * ALLAN GEORGE MATHEW — REAL-TIME IGLOO-INSPIRED PARTICLE EXPERIENCE
 * 
 * Interactive 3D Digital Identity Terminal inside the Contact Section.
 * 
 * Key Features:
 * 1. GPU Particle System:
 *    - Thousands of particles (~6,400 desktop / ~2,800 mobile) rendered in a single draw call.
 *    - Custom ShaderMaterial with 3D curl turbulence and physical spring-damper displacement.
 *    - Authentically styled in Allan's dark hacker palette:
 *      * Background: #030504
 *      * Primary particle glow: #A8FF35 (volt/acid)
 *      * Emerald highlights: #35E89A
 *      * Electric cyan accents: #16D9FF
 *      * Bright highlights: #F2F5F0
 * 
 * 2. 5 Distinct Morphable Particle Shapes:
 *    - [0] Avatar: Allan's masked cybersecurity operator with 2.5D volumetric relief.
 *    - [1] GitHub: Recognizable 3D Octocat silhouette & code branch symbol.
 *    - [2] LinkedIn: Professional connected network node constellation & monogram.
 *    - [3] Email: 3D holographic folded envelope with transmission arcs.
 *    - [4] Contact: Interactive holographic radar beacon / direct inquiry signal.
 * 
 * 3. Physical Fluid Cursor Interaction:
 *    - Cursor acts as a spatial collider pushing particles away with spring return.
 *    - Velocity-dependent trail brightening: fast sweeping creates electric cyan glow trails.
 * 
 * 4. Grounded Holographic Stage:
 *    - Dark circular platform with counter-rotating emerald and cyan rings.
 *    - Vertical holographic light cone and ambient depth haze.
 * 
 * 5. Telemetry & Real Actions:
 *    - Real contact actions: all links (mailto, GitHub, LinkedIn, modal) remain 100% functional.
 *    - Monospace HUD with real-time status readouts.
 *    - IntersectionObserver pauses rendering when out of viewport for optimal performance.
 */

import * as THREE from 'three';
import { gsap } from 'gsap';

export function initContactHologramTerminal(containerId = 'contact-terminal-stage') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reduced motion: show clean static avatar preview and skip heavy WebGL
  if (reducedMotion) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center p-8 text-center">
        <img src="assets/masked-operator-hero.png" alt="Allan George Mathew Avatar" class="w-48 h-48 object-contain mb-4 filter drop-shadow-[0_0_20px_rgba(53,232,154,0.3)]">
        <p class="font-mono text-xs text-[#35E89A] tracking-widest uppercase">TERMINAL ACTIVE // STATIC MODE (REDUCED MOTION)</p>
      </div>
    `;
    return;
  }

  // ---------------------------------------------------------------------------
  // 1. Scene, Camera, Renderer Setup
  // ---------------------------------------------------------------------------
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x030504, 0.0014);

  let width = container.clientWidth || 800;
  let height = container.clientHeight || 520;

  const camera = new THREE.PerspectiveCamera(45, width / height, 1, 3000);
  camera.position.set(0, 15, 520);
  camera.lookAt(0, 0, 0);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
  } catch (err) {
    console.warn('WebGL not available for contact terminal:', err);
    return;
  }

  renderer.setSize(width, height, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.display = 'block';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // Palette Constants
  const COLOR_ACID    = new THREE.Color(0xA8FF35);
  const COLOR_EMERALD = new THREE.Color(0x35E89A);
  const COLOR_CYAN    = new THREE.Color(0x16D9FF);
  const COLOR_WHITE   = new THREE.Color(0xF2F5F0);
  const COLOR_SHADOW  = new THREE.Color(0x04180A);

  const isMobile = window.innerWidth < 768;
  const PARTICLE_COUNT = isMobile ? 3200 : 7200;

  // ---------------------------------------------------------------------------
  // 2. Hologram Circular Stage (Floor, Concentric Rings & Light Cone)
  // ---------------------------------------------------------------------------
  const stageGroup = new THREE.Group();
  stageGroup.position.set(0, -135, -10);
  stageGroup.rotation.x = Math.PI * 0.44; // Tilted perspective
  scene.add(stageGroup);

  // A. Dark Circular Platform Base
  const platformBaseGeom = new THREE.CircleGeometry(165, 48);
  const platformBaseMat = new THREE.MeshBasicMaterial({
    color: 0x020804,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide
  });
  const platformBase = new THREE.Mesh(platformBaseGeom, platformBaseMat);
  stageGroup.add(platformBase);

  // B. Outer Cyan Ring
  const outerRingGeom = new THREE.RingGeometry(162, 165, 64);
  const outerRingMat = new THREE.MeshBasicMaterial({
    color: COLOR_CYAN,
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
  const outerRing = new THREE.Mesh(outerRingGeom, outerRingMat);
  stageGroup.add(outerRing);

  // C. Middle Emerald Dashed Ring
  const midRingGeom = new THREE.RingGeometry(122, 125, 48);
  const midRingMat = new THREE.MeshBasicMaterial({
    color: COLOR_EMERALD,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
  const midRing = new THREE.Mesh(midRingGeom, midRingMat);
  stageGroup.add(midRing);

  // D. Core Acid Ring
  const coreRingGeom = new THREE.RingGeometry(78, 80, 36);
  const coreRingMat = new THREE.MeshBasicMaterial({
    color: COLOR_ACID,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
  const coreRing = new THREE.Mesh(coreRingGeom, coreRingMat);
  stageGroup.add(coreRing);

  // E. Hologram Upward Projection Light Cone
  const beamGeom = new THREE.CylinderGeometry(130, 165, 340, 32, 1, true);
  const beamMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0.0 }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vNormal;
      void main() {
        float vFade = pow(1.0 - vUv.y, 2.4);
        float rim = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.2);
        float scan = sin(vUv.y * 45.0 - uTime * 3.5) * 0.15 + 0.85;
        vec3 col = mix(vec3(0.2, 0.95, 0.6), vec3(0.08, 0.85, 1.0), vUv.y);
        float alpha = vFade * rim * scan * 0.22;
        gl_FragColor = vec4(col * alpha, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
  const hologramBeam = new THREE.Mesh(beamGeom, beamMat);
  hologramBeam.rotation.x = -Math.PI * 0.44;
  hologramBeam.position.set(0, 170, 0);
  stageGroup.add(hologramBeam);

  // ---------------------------------------------------------------------------
  // 3. Procedural & Sampled Shape Point Generators
  // ---------------------------------------------------------------------------
  const shapeLibraries = {
    avatar: null,
    github: null,
    linkedin: null,
    email: null,
    contact: null
  };

  // Helper to ensure target array has exactly PARTICLE_COUNT items
  function normalizePoints(rawPoints, count) {
    const out = new Float32Array(count * 3);
    const n = Math.floor(rawPoints.length / 3);
    if (n === 0) return out;

    for (let i = 0; i < count; i++) {
      const srcIdx = (i % n) * 3;
      out[i * 3]     = rawPoints[srcIdx] + (Math.random() - 0.5) * 3.0;
      out[i * 3 + 1] = rawPoints[srcIdx + 1] + (Math.random() - 0.5) * 3.0;
      out[i * 3 + 2] = rawPoints[srcIdx + 2] + (Math.random() - 0.5) * 3.0;
    }
    return out;
  }

  // A. Generate GitHub Octocat + Code Silhouette
  function generateGitHubPoints(count) {
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new Float32Array(count * 3);

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 240, 240);

    // Draw Octocat silhouette using path
    ctx.save();
    ctx.translate(20, 20);
    ctx.scale(8.2, 8.2);
    ctx.fillStyle = '#FFFFFF';
    const p = new Path2D("M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z");
    ctx.fill(p);
    ctx.restore();

    // Additional cyber brackets < />
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 6;
    ctx.font = 'bold 36px monospace';
    ctx.strokeText('< / >', 70, 225);

    const imgData = ctx.getImageData(0, 0, 240, 240).data;
    const raw = [];
    for (let y = 0; y < 240; y += 2) {
      for (let x = 0; x < 240; x += 2) {
        const idx = (y * 240 + x) * 4;
        if (imgData[idx] > 100) {
          const nx = (x - 120) * 1.35;
          const ny = -(y - 120) * 1.35 + 10;
          const dist = Math.sqrt(nx * nx + ny * ny);
          const nz = Math.cos(dist * 0.025) * 32.0;
          raw.push(nx, ny, nz);
        }
      }
    }
    return normalizePoints(raw, count);
  }

  // B. Generate LinkedIn Network Node Constellation
  function generateLinkedInPoints(count) {
    const raw = [];
    // 1. Interconnected network nodes and rings in 3D
    const nodes = [
      { x: 0, y: 15, z: 20 },
      { x: -65, y: 55, z: -10 },
      { x: 65, y: 60, z: -15 },
      { x: -75, y: -40, z: 10 },
      { x: 75, y: -35, z: 12 },
      { x: -30, y: -75, z: -20 },
      { x: 35, y: -70, z: -18 },
      { x: -100, y: 10, z: -30 },
      { x: 105, y: 15, z: -25 }
    ];

    // Sample dense spheres at nodes
    nodes.forEach(node => {
      for (let i = 0; i < 280; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = Math.cbrt(Math.random()) * 18.0;
        const sinPhi = Math.sin(phi);
        raw.push(
          node.x + r * sinPhi * Math.cos(theta),
          node.y + r * sinPhi * Math.sin(theta),
          node.z + r * Math.cos(phi)
        );
      }
    });

    // Sample connecting network filaments between nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const n1 = nodes[i];
        const n2 = nodes[j];
        const d = Math.hypot(n1.x - n2.x, n1.y - n2.y, n1.z - n2.z);
        if (d < 140) {
          const steps = Math.floor(d * 1.4);
          for (let s = 0; s < steps; s++) {
            const t = s / steps;
            raw.push(
              n1.x + (n2.x - n1.x) * t + (Math.random() - 0.5) * 4.0,
              n1.y + (n2.y - n1.y) * t + (Math.random() - 0.5) * 4.0,
              n1.z + (n2.z - n1.z) * t + (Math.random() - 0.5) * 4.0
            );
          }
        }
      }
    }

    // Outer orbital shield ring
    for (let i = 0; i < 1200; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 125 + (Math.random() - 0.5) * 12;
      raw.push(
        Math.cos(angle) * r,
        Math.sin(angle) * r * 0.92,
        (Math.random() - 0.5) * 18
      );
    }

    return normalizePoints(raw, count);
  }

  // C. Generate 3D Holographic Envelope / Message Glyph
  function generateEmailPoints(count) {
    const raw = [];
    const w = 180;
    const h = 120;

    // Outer rectangle frame
    for (let x = -w / 2; x <= w / 2; x += 1.8) {
      raw.push(x, -h / 2, 0);
      raw.push(x, h / 2, 0);
    }
    for (let y = -h / 2; y <= h / 2; y += 1.8) {
      raw.push(-w / 2, y, 0);
      raw.push(w / 2, y, 0);
    }

    // Folded triangular top flap in 3D relief
    const flapTop = { x: 0, y: 10, z: 28 };
    for (let t = 0; t <= 1; t += 0.012) {
      // Left crease: from (-w/2, h/2) to flapTop
      raw.push(
        -w / 2 + (flapTop.x - (-w / 2)) * t,
        h / 2 + (flapTop.y - h / 2) * t,
        flapTop.z * t
      );
      // Right crease: from (w/2, h/2) to flapTop
      raw.push(
        w / 2 + (flapTop.x - w / 2) * t,
        h / 2 + (flapTop.y - h / 2) * t,
        flapTop.z * t
      );
      // Bottom crease lines
      raw.push(
        -w / 2 + (0 - (-w / 2)) * t,
        -h / 2 + (-15 - (-h / 2)) * t,
        10 * t
      );
      raw.push(
        w / 2 + (0 - w / 2) * t,
        -h / 2 + (-15 - (-h / 2)) * t,
        10 * t
      );
    }

    // Interior plane density
    for (let y = -h / 2; y <= h / 2; y += 4.5) {
      for (let x = -w / 2; x <= w / 2; x += 4.5) {
        const dist = Math.abs(x) / (w / 2);
        raw.push(x, y, (1.0 - dist) * 12.0 + (Math.random() - 0.5) * 4.0);
      }
    }

    // Radiating digital transmission arcs above envelope
    for (let arc = 1; arc <= 3; arc++) {
      const arcRadius = 50 + arc * 28;
      for (let angle = Math.PI * 0.2; angle <= Math.PI * 0.8; angle += 0.03) {
        raw.push(
          Math.cos(angle) * arcRadius,
          h / 2 + 10 + Math.sin(angle) * (arcRadius * 0.55),
          (Math.random() - 0.5) * 12
        );
      }
    }

    return normalizePoints(raw, count);
  }

  // D. Generate Holographic Radar / Direct Dispatch Glyph
  function generateContactPoints(count) {
    const raw = [];

    // Concentric transmission radar rings
    [35, 68, 105, 140].forEach((r, idx) => {
      const step = 0.02 - idx * 0.003;
      for (let a = 0; a < Math.PI * 2; a += Math.max(0.01, step)) {
        raw.push(
          Math.cos(a) * r + (Math.random() - 0.5) * 3,
          Math.sin(a) * r + (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 14
        );
      }
    });

    // Crosshair axes
    for (let d = -145; d <= 145; d += 2.2) {
      raw.push(d, 0, (Math.random() - 0.5) * 6);
      raw.push(0, d, (Math.random() - 0.5) * 6);
    }

    // Center pulsating core sphere
    for (let i = 0; i < 450; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random()) * 22.0;
      raw.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
    }

    // Intersecting dialog bubble arcs
    for (let a = -Math.PI * 0.4; a <= Math.PI * 0.4; a += 0.03) {
      raw.push(
        55 + Math.cos(a) * 45,
        35 + Math.sin(a) * 45,
        20 + Math.sin(a * 2.0) * 10
      );
      raw.push(
        -55 - Math.cos(a) * 45,
        -35 - Math.sin(a) * 45,
        -20 - Math.sin(a * 2.0) * 10
      );
    }

    return normalizePoints(raw, count);
  }

  // E. Sample Avatar Image for Primary Identity
  function sampleAvatarPoints(img, count) {
    const off = document.createElement('canvas');
    const nw = img.naturalWidth || 600;
    const nh = img.naturalHeight || 750;
    off.width = nw;
    off.height = nh;
    const ctx = off.getContext('2d', { willReadFrequently: true });
    if (!ctx) return new Float32Array(count * 3);

    ctx.drawImage(img, 0, 0, nw, nh);
    const data = ctx.getImageData(0, 0, nw, nh).data;
    const raw = [];

    const step = isMobile ? 6 : 4;
    for (let y = 0; y < nh; y += step) {
      for (let x = 0; x < nw; x += step) {
        const idx = (y * nw + x) * 4;
        if (data[idx + 3] > 30) {
          const r = data[idx] / 255;
          const g = data[idx + 1] / 255;
          const b = data[idx + 2] / 255;
          const brightness = (r + g + b) / 3;

          const nx = (x - nw / 2) * (260 / nw);
          const ny = -(y - nh / 2) * (330 / nh) + 12;

          const dist = Math.sqrt((nx / 130) * (nx / 130) + (ny / 165) * (ny / 165));
          let nz = Math.max(0.0, 1.0 - dist) * 46.0;
          if (dist < 0.6) nz += brightness * 24.0;

          raw.push(nx, ny, nz);
        }
      }
    }
    return normalizePoints(raw, count);
  }

  // ---------------------------------------------------------------------------
  // 4. Build GPU Particle System with Dual Interpolation Buffers
  // ---------------------------------------------------------------------------
  let particleMesh = null;
  let posAttr = null;
  let targetAttr = null;

  const uniforms = {
    uTime: { value: 0.0 },
    uMorphProgress: { value: 1.0 }, // 0.0 -> 1.0 interpolation
    uMouse: { value: new THREE.Vector2(0, 0) },
    uMouseSpeed: { value: 0.0 },
    uPusherRadius: { value: 155.0 },
    uPusherStrength: { value: 58.0 },
    uPixelDensity: { value: Math.min(window.devicePixelRatio || 1, 2) }
  };

  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0, prevX: 0, prevY: 0, speed: 0 };
  const onPointerMove = (e) => {
    const rect = container.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    mouse.targetX = Math.max(-1.4, Math.min(1.4, nx));
    mouse.targetY = Math.max(-1.4, Math.min(1.4, ny));
  };
  container.addEventListener('pointermove', onPointerMove, { passive: true });

  function assembleParticleEngine() {
    shapeLibraries.github   = generateGitHubPoints(PARTICLE_COUNT);
    shapeLibraries.linkedin = generateLinkedInPoints(PARTICLE_COUNT);
    shapeLibraries.email    = generateEmailPoints(PARTICLE_COUNT);
    shapeLibraries.contact  = generateContactPoints(PARTICLE_COUNT);

    // Initial shape: Avatar
    const initialPos = new Float32Array(shapeLibraries.avatar);
    const targetPos  = new Float32Array(shapeLibraries.avatar);

    const turbulence = new Float32Array(PARTICLE_COUNT * 3);
    const phases = new Float32Array(PARTICLE_COUNT);
    const sizes  = new Float32Array(PARTICLE_COUNT);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Deterministic 3D turbulence direction for smooth morph scatter
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;
      turbulence[i * 3]     = Math.cos(phi) * Math.sin(theta);
      turbulence[i * 3 + 1] = Math.sin(phi);
      turbulence[i * 3 + 2] = Math.cos(phi) * Math.cos(theta);

      phases[i] = Math.random() * Math.PI * 2;
      sizes[i]  = Math.random() * 2.2 + 2.0;

      // Color palette mapping: volt green (#A8FF35), emerald (#35E89A), cyan (#16D9FF)
      const rand = Math.random();
      let col = COLOR_EMERALD;
      if (rand > 0.65) col = COLOR_CYAN;
      else if (rand > 0.3) col = COLOR_ACID;
      else if (rand > 0.15) col = COLOR_WHITE;

      colors[i * 3]     = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    const geometry = new THREE.BufferGeometry();
    posAttr = new THREE.BufferAttribute(initialPos, 3);
    targetAttr = new THREE.BufferAttribute(targetPos, 3);

    geometry.setAttribute('position', posAttr);
    geometry.setAttribute('aTarget', targetAttr);
    geometry.setAttribute('aTurbulence', new THREE.BufferAttribute(turbulence, 3));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        uniform float uTime;
        uniform float uMorphProgress;
        uniform vec2 uMouse;
        uniform float uMouseSpeed;
        uniform float uPusherRadius;
        uniform float uPusherStrength;
        uniform float uPixelDensity;

        attribute vec3 aTarget;
        attribute vec3 aTurbulence;
        attribute float aPhase;
        attribute float aSize;
        attribute vec3 aColor;

        varying vec3 vColor;
        varying float vGlow;
        varying float vAlpha;

        void main() {
          vColor = aColor;

          // 1. Smooth Morphing with 3D Curl Turbulence
          float t = smoothstep(0.0, 1.0, uMorphProgress);

          // Organic scattering envelope during mid-transition
          float scatter = sin(t * 3.14159265);
          float swirlAngle = scatter * 2.6 + aPhase;
          mat2 rot = mat2(cos(swirlAngle), -sin(swirlAngle), sin(swirlAngle), cos(swirlAngle));

          vec3 midScatter = aTurbulence * (scatter * 95.0);
          vec3 currentPos = mix(position, aTarget, t) + midScatter;
          currentPos.xy = mix(currentPos.xy, rot * currentPos.xy, scatter * 0.65);

          // 2. Idle Organic Floating & Breathing
          currentPos.y += sin(uTime * 1.5 + aPhase) * 2.2;
          currentPos.x += cos(uTime * 1.2 + aPhase) * 1.8;
          currentPos.z += sin(uTime * 1.0 + aPhase) * 2.4;

          // 3. Fluid Pusher Cursor Physics with Velocity Trail Reaction
          vec3 mouse3D = vec3(uMouse.x * 240.0, uMouse.y * 180.0, 20.0);
          vec3 toMouse = currentPos - mouse3D;
          float dist = length(toMouse.xy);
          float displacementGlow = 0.0;

          if (dist < uPusherRadius) {
            float influence = pow(1.0 - dist / uPusherRadius, 1.7);
            vec2 pushDir = normalize(toMouse.xy + vec2(0.001));

            // Turbulence swirl around cursor
            float turb = uTime * 3.2 + aPhase;
            mat2 tRot = mat2(cos(turb), -sin(turb), sin(turb), cos(turb));
            vec2 swirledDir = tRot * pushDir;

            vec3 pushOffset = vec3(
              swirledDir * (influence * uPusherStrength * (1.0 + uMouseSpeed * 0.7)),
              influence * 26.0
            );
            currentPos += pushOffset;

            // Displaced particles glow intensely
            displacementGlow = influence * (1.0 + uMouseSpeed * 1.6);
          }
          vGlow = displacementGlow;

          // 4. Holographic Scanline Micro-Displacement
          float scan = sin(currentPos.y * 0.055 - uTime * 3.0 + aPhase * 0.6);
          currentPos.z += smoothstep(0.75, 1.0, scan) * 3.5;

          vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Size attenuation
          float pointScale = aSize * (460.0 / -mvPosition.z) * uPixelDensity;
          pointScale *= (1.0 + displacementGlow * 0.45);
          gl_PointSize = clamp(pointScale, 1.4, 18.0);

          // Alpha
          vAlpha = 0.88 + 0.12 * sin(uTime * 2.0 + aPhase);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vGlow;
        varying float vAlpha;
        uniform float uTime;

        void main() {
          // Circular particle with smooth anti-aliased edge
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float smoothEdge = smoothstep(0.5, 0.08, d);

          // Physics-Driven Trail Glow
          vec3 outColor = vColor;
          if (vGlow > 0.01) {
            vec3 neonCyan = vec3(0.08, 0.88, 1.0);
            vec3 whiteFlash = vec3(0.95, 1.0, 0.98);
            outColor = mix(outColor, neonCyan, clamp(vGlow, 0.0, 1.0));
            outColor += whiteFlash * (vGlow * 0.55);
          }

          float flicker = 0.94 + 0.06 * sin(uTime * 28.0);
          gl_FragColor = vec4(outColor * flicker * (vAlpha * smoothEdge), vAlpha * smoothEdge);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    particleMesh = new THREE.Points(geometry, material);
    scene.add(particleMesh);
  }

  // ---------------------------------------------------------------------------
  // 5. Morphing Controller (GSAP Smooth Transition)
  // ---------------------------------------------------------------------------
  let currentShapeKey = 'avatar';
  let isMorphing = false;

  function morphTo(shapeKey) {
    if (shapeKey === currentShapeKey || isMorphing || !shapeLibraries[shapeKey]) return;
    isMorphing = true;

    const sourceData = shapeLibraries[currentShapeKey];
    const targetData = shapeLibraries[shapeKey];

    // Lock position to source, target to next shape
    posAttr.copyArray(sourceData);
    posAttr.needsUpdate = true;

    targetAttr.copyArray(targetData);
    targetAttr.needsUpdate = true;

    uniforms.uMorphProgress.value = 0.0;

    // Update Telemetry HUD
    const labelMap = {
      avatar: 'IDENTITY // AVATAR.SYS',
      github: 'NODE // GITHUB.OCTO',
      linkedin: 'NODE // LINKEDIN.NET',
      email: 'CHANNEL // EMAIL.DISPATCH',
      contact: 'TRANSMISSION // DIRECT.INQUIRY'
    };
    const hudLabel = document.getElementById('holo-active-label');
    if (hudLabel) {
      hudLabel.textContent = labelMap[shapeKey] || shapeKey.toUpperCase();
    }

    // Highlight active control tab
    document.querySelectorAll('.holo-tab-btn').forEach(btn => {
      const match = btn.getAttribute('data-shape') === shapeKey;
      btn.classList.toggle('border-[#35E89A]', match);
      btn.classList.toggle('text-[#A8FF35]', match);
      btn.classList.toggle('bg-[#35E89A]/15', match);
      btn.classList.toggle('border-neutral-800', !match);
      btn.classList.toggle('text-neutral-400', !match);
      btn.classList.toggle('bg-transparent', !match);
    });

    gsap.to(uniforms.uMorphProgress, {
      value: 1.0,
      duration: 1.35,
      ease: 'power2.inOut',
      onComplete: () => {
        currentShapeKey = shapeKey;
        // Bake settled target position into base buffer
        posAttr.copyArray(targetData);
        posAttr.needsUpdate = true;
        isMorphing = false;
      }
    });
  }

  // Expose global morph trigger for DOM buttons and contact links
  window.morphContactHologram = morphTo;

  // ---------------------------------------------------------------------------
  // 6. Render Loop with Viewport Visibility Observer
  // ---------------------------------------------------------------------------
  let animId = 0;
  let isRunning = true;
  let isVisible = true;
  const clock = new THREE.Clock();

  function renderLoop() {
    if (!isRunning) return;
    animId = requestAnimationFrame(renderLoop);

    if (!isVisible) return; // Skip work when scrolled away

    const elapsed = clock.getElapsedTime();
    uniforms.uTime.value = elapsed;
    beamMat.uniforms.uTime.value = elapsed;

    // Smooth Mouse Tracking & Speed Calculation
    mouse.prevX = mouse.x;
    mouse.prevY = mouse.y;
    mouse.x += (mouse.targetX - mouse.x) * 0.07;
    mouse.y += (mouse.targetY - mouse.y) * 0.07;
    uniforms.uMouse.value.set(mouse.x, mouse.y);

    const instantSpeed = Math.hypot(mouse.x - mouse.prevX, mouse.y - mouse.prevY) * 60;
    mouse.speed += (instantSpeed - mouse.speed) * 0.1;
    uniforms.uMouseSpeed.value = Math.min(2.5, mouse.speed);

    // Rotate Holographic Base Rings
    outerRing.rotation.z = elapsed * 0.22;
    midRing.rotation.z   = -elapsed * 0.35;
    coreRing.rotation.z  = elapsed * 0.48;

    // Slow gentle orbital drift for the particle sculpture
    if (particleMesh) {
      particleMesh.rotation.y = Math.sin(elapsed * 0.4) * 0.18 + mouse.x * 0.12;
      particleMesh.rotation.x = Math.cos(elapsed * 0.3) * 0.06 - mouse.y * 0.08;
    }

    // Camera subtle parallax
    camera.position.x = mouse.x * 24;
    camera.position.y = 15 + mouse.y * 16;
    camera.lookAt(0, 5, 0);

    renderer.render(scene, camera);
  }

  // IntersectionObserver: pauses GPU rendering when contact area is off-screen
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      isVisible = entry.isIntersecting;
    });
  }, { threshold: 0.05 });
  observer.observe(container);

  renderLoop();

  // Resize handler
  const onResize = () => {
    width = container.clientWidth || 800;
    height = container.clientHeight || 520;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    uniforms.uPixelDensity.value = Math.min(window.devicePixelRatio || 1, 2);
  };
  window.addEventListener('resize', onResize, { passive: true });

  // ---------------------------------------------------------------------------
  // 7. Load Masked Operator Avatar Image & Initialize
  // ---------------------------------------------------------------------------
  const avatarImg = new Image();
  avatarImg.crossOrigin = 'anonymous';
  avatarImg.onload = () => {
    shapeLibraries.avatar = sampleAvatarPoints(avatarImg, PARTICLE_COUNT);
    assembleParticleEngine();
  };
  avatarImg.onerror = () => {
    // Fallback: procedural cylinder cloud
    const dummy = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 80 * Math.sqrt(Math.random());
      const z = (Math.random() - 0.5) * 60;
      dummy.push(Math.cos(a) * r, (Math.random() - 0.5) * 200, z);
    }
    shapeLibraries.avatar = normalizePoints(dummy, PARTICLE_COUNT);
    assembleParticleEngine();
  };
  avatarImg.src = 'assets/masked-operator-hero.png';

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    isRunning = false;
    cancelAnimationFrame(animId);
    observer.disconnect();
    window.removeEventListener('resize', onResize);
    renderer?.dispose();
  });
}
