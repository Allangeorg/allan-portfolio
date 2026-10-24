/**
 * contact-hologram-terminal.js
 * 
 * ALLAN GEORGE MATHEW — IGLOO-INSPIRED 3D PARTICLE SCULPTURE EXPERIENCE
 * 
 * Visual Rescue Upgrades:
 * - Removed all faux terminal-panel borders, boxed cards, and GPS telemetry boxes.
 * - Created a large, heroic, full-width 3D scene (height ~740px) with transparent background.
 * - Increased sculpture scale (~360 units tall), commanding central visual focus.
 * - Luminous, high-contrast hacker palette: #A8FF35 volt, #35E89A emerald, #16D9FF cyan, #E6FFFF white.
 * - Authentic 2.5D volumetric avatar sculpture preserving hood, mask, visor, and shoulders.
 * - 5 high-fidelity deterministic 3D shapes: Avatar, GitHub Octocat, LinkedIn Network, Email Envelope, Transmission Radar.
 * - Fluid spring-damper cursor physics with velocity-driven luminous trails.
 * - Illuminated circular platform with rotating rings and vertical light cone.
 * - Viewport visibility observer for zero idle GPU usage when scrolled away.
 */

import * as THREE from 'three';
import { gsap } from 'gsap';

export function initContactHologramTerminal(containerId = 'contact-stage-container') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reduced motion fallback: show clean static avatar preview
  if (reducedMotion) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center p-8 text-center select-none pointer-events-none">
        <img src="assets/masked-operator-hero.png" alt="Allan George Mathew Avatar" class="w-64 h-64 object-contain filter drop-shadow-[0_0_30px_rgba(53,232,154,0.4)]">
        <p class="font-mono text-xs text-[#35E89A] tracking-widest uppercase mt-4">STATIC DISPLAY // PREFERS REDUCED MOTION</p>
      </div>
    `;
    return;
  }

  // ---------------------------------------------------------------------------
  // 1. Three.js Scene, Camera & Renderer
  // ---------------------------------------------------------------------------
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x030504, 0.0011);

  let width = container.clientWidth || 1000;
  let height = container.clientHeight || 720;

  const camera = new THREE.PerspectiveCamera(45, width / height, 1, 3500);
  camera.position.set(0, 10, 440);
  camera.lookAt(0, 10, 0);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
  } catch (err) {
    console.warn('WebGL not available for contact particle sculpture:', err);
    return;
  }

  renderer.setSize(width, height, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.pointerEvents = 'auto';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // Palette Constants
  const COLOR_ACID    = new THREE.Color(0xA8FF35); // #A8FF35 Volt green
  const COLOR_EMERALD = new THREE.Color(0x35E89A); // #35E89A Glowing emerald
  const COLOR_CYAN    = new THREE.Color(0x16D9FF); // #16D9FF Electric cyan
  const COLOR_WHITE   = new THREE.Color(0xE6FFFF); // #E6FFFF Luminous white
  const COLOR_SHADOW  = new THREE.Color(0x0E3A20); // Deep glowing forest emerald (never pitch black)

  const isMobile = window.innerWidth < 768;
  const PARTICLE_COUNT = isMobile ? 4200 : 9600;

  // ---------------------------------------------------------------------------
  // 2. Grounded Circular Stage (Platform Rings & Volumetric Light Beam)
  // ---------------------------------------------------------------------------
  const stageGroup = new THREE.Group();
  stageGroup.position.set(0, -155, -15);
  stageGroup.rotation.x = Math.PI * 0.44; // Tilted perspective disc
  scene.add(stageGroup);

  // A. Dark Reflective Base Disc
  const platformBaseGeom = new THREE.CircleGeometry(210, 64);
  const platformBaseMat = new THREE.MeshBasicMaterial({
    color: 0x020804,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide
  });
  const platformBase = new THREE.Mesh(platformBaseGeom, platformBaseMat);
  stageGroup.add(platformBase);

  // B. Outer Electric Cyan Ring (Large heroic radius 208)
  const outerRingGeom = new THREE.RingGeometry(204, 208, 64);
  const outerRingMat = new THREE.MeshBasicMaterial({
    color: COLOR_CYAN,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
  const outerRing = new THREE.Mesh(outerRingGeom, outerRingMat);
  stageGroup.add(outerRing);

  // C. Middle Radiant Emerald Ring (Radius 165)
  const midRingGeom = new THREE.RingGeometry(162, 166, 56);
  const midRingMat = new THREE.MeshBasicMaterial({
    color: COLOR_EMERALD,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
  const midRing = new THREE.Mesh(midRingGeom, midRingMat);
  stageGroup.add(midRing);

  // D. Core Volt Green Ring (Radius 112)
  const coreRingGeom = new THREE.RingGeometry(110, 114, 48);
  const coreRingMat = new THREE.MeshBasicMaterial({
    color: COLOR_ACID,
    transparent: true,
    opacity: 0.95,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
  const coreRing = new THREE.Mesh(coreRingGeom, coreRingMat);
  stageGroup.add(coreRing);

  // E. Inner Pulse Beacon Ring
  const pulseRingGeom = new THREE.RingGeometry(60, 62, 36);
  const pulseRingMat = new THREE.MeshBasicMaterial({
    color: COLOR_WHITE,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
  const pulseRing = new THREE.Mesh(pulseRingGeom, pulseRingMat);
  stageGroup.add(pulseRing);

  // F. Upward Volumetric Hologram Light Cylinder
  const beamGeom = new THREE.CylinderGeometry(170, 210, 420, 36, 1, true);
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
        float vFade = pow(1.0 - vUv.y, 2.2);
        float rim = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
        float scan = sin(vUv.y * 50.0 - uTime * 3.5) * 0.18 + 0.82;
        vec3 col = mix(vec3(0.2, 0.98, 0.6), vec3(0.08, 0.88, 1.0), vUv.y);
        float alpha = vFade * rim * scan * 0.28;
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
  hologramBeam.position.set(0, 210, 0);
  stageGroup.add(hologramBeam);

  // ---------------------------------------------------------------------------
  // 3. High-Fidelity 3D Target Shape Generators
  // ---------------------------------------------------------------------------
  const shapeLibraries = {
    avatar: null,
    github: null,
    linkedin: null,
    email: null,
    contact: null
  };

  // Resample array to exact particle count without clumping
  function fitPoints(raw, count) {
    const out = new Float32Array(count * 3);
    const n = Math.floor(raw.length / 3);
    if (n === 0) return out;

    for (let i = 0; i < count; i++) {
      const srcIdx = (i % n) * 3;
      out[i * 3]     = raw[srcIdx] + (Math.random() - 0.5) * 1.5;
      out[i * 3 + 1] = raw[srcIdx + 1] + (Math.random() - 0.5) * 1.5;
      out[i * 3 + 2] = raw[srcIdx + 2] + (Math.random() - 0.5) * 1.5;
    }
    return out;
  }

  // A. Sample Avatar from masked-operator-hero.png with Volumetric Relief
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

    // Scale to fill central stage (~360px tall)
    const targetHeight = 360;
    const targetWidth  = (nw / nh) * targetHeight;
    const step = isMobile ? 3 : 2;

    for (let y = 0; y < nh; y += step) {
      for (let x = 0; x < nw; x += step) {
        const idx = (y * nw + x) * 4;
        const a = data[idx + 3];
        if (a > 22) {
          const r = data[idx] / 255;
          const g = data[idx + 1] / 255;
          const b = data[idx + 2] / 255;
          const brightness = (r + g + b) / 3;

          const nx = (x - nw / 2) * (targetWidth / nw);
          const ny = -(y - nh / 2) * (targetHeight / nh) + 15;

          // Realistic anatomical depth contours:
          const normX = (x - nw / 2) / (nw / 2);
          const normY = (y - nh / 2) / (nh / 2);
          const faceDist = Math.sqrt(normX * normX * 1.6 + Math.pow(normY + 0.12, 2) * 2.2);

          let nz = Math.max(0.0, 1.0 - faceDist) * 62.0;
          // Visor & nose bridge project forward
          if (faceDist < 0.6) {
            nz += brightness * 35.0;
          }
          // Hood wraps forward around head
          if (faceDist > 0.62 && faceDist < 0.95 && normY < 0.22) {
            nz += 22.0;
          }
          // Torso & shoulders curve backward into depth
          if (normY > 0.15) {
            nz -= (normX * normX) * 55.0;
          }

          raw.push(nx, ny, nz);
        }
      }
    }
    return fitPoints(raw, count);
  }

  // B. Generate 3D GitHub Octocat Silhouette & Code Brackets
  function generateGitHubPoints(count) {
    const off = document.createElement('canvas');
    off.width = 360;
    off.height = 360;
    const ctx = off.getContext('2d');
    if (!ctx) return new Float32Array(count * 3);

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 360, 360);

    // Large Octocat SVG path centered and scaled
    ctx.save();
    ctx.translate(35, 25);
    ctx.scale(12.2, 12.2);
    ctx.fillStyle = '#FFFFFF';
    const p = new Path2D("M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z");
    ctx.fill(p);
    ctx.restore();

    // Bold Code Brackets < / >
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 10;
    ctx.font = 'bold 54px monospace';
    ctx.strokeText('< / >', 105, 345);

    const imgData = ctx.getImageData(0, 0, 360, 360).data;
    const raw = [];
    for (let y = 0; y < 360; y += 2) {
      for (let x = 0; x < 360; x += 2) {
        const idx = (y * 360 + x) * 4;
        if (imgData[idx] > 80) {
          const nx = (x - 180) * 0.95;
          const ny = -(y - 180) * 0.95 + 10;
          const dist = Math.sqrt(nx * nx + ny * ny);
          const nz = Math.cos(dist * 0.018) * 38.0;
          raw.push(nx, ny, nz);
        }
      }
    }
    return fitPoints(raw, count);
  }

  // C. Generate 3D LinkedIn Professional Network Constellation & Monogram
  function generateLinkedInPoints(count) {
    const raw = [];
    const scale = 1.3;

    // 14 Primary Node Hubs
    const nodes = [
      { x: 0, y: 25, z: 25 },
      { x: -85, y: 75, z: -15 },
      { x: 85, y: 80, z: -20 },
      { x: -95, y: -45, z: 12 },
      { x: 95, y: -40, z: 15 },
      { x: -45, y: -105, z: -25 },
      { x: 50, y: -100, z: -22 },
      { x: -135, y: 15, z: -35 },
      { x: 140, y: 20, z: -30 },
      { x: -35, y: 125, z: 10 },
      { x: 40, y: 130, z: 8 },
      { x: 0, y: -65, z: 30 }
    ];

    // High density particle spheres at node coordinates
    nodes.forEach(n => {
      for (let i = 0; i < 340; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = Math.cbrt(Math.random()) * 22.0;
        raw.push(
          (n.x + r * Math.sin(phi) * Math.cos(theta)) * scale,
          (n.y + r * Math.sin(phi) * Math.sin(theta)) * scale,
          (n.z + r * Math.cos(phi)) * scale
        );
      }
    });

    // Connecting geometric filaments
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const n1 = nodes[i];
        const n2 = nodes[j];
        const d = Math.hypot(n1.x - n2.x, n1.y - n2.y, n1.z - n2.z);
        if (d < 165) {
          const steps = Math.floor(d * 1.6);
          for (let s = 0; s < steps; s++) {
            const t = s / steps;
            raw.push(
              (n1.x + (n2.x - n1.x) * t + (Math.random() - 0.5) * 3) * scale,
              (n1.y + (n2.y - n1.y) * t + (Math.random() - 0.5) * 3) * scale,
              (n1.z + (n2.z - n1.z) * t + (Math.random() - 0.5) * 3) * scale
            );
          }
        }
      }
    }

    // Outer architectural shield rings
    for (let i = 0; i < 1600; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = (155 + (Math.random() - 0.5) * 12) * scale;
      raw.push(
        Math.cos(angle) * r,
        Math.sin(angle) * r * 0.92,
        (Math.random() - 0.5) * 22
      );
    }

    return fitPoints(raw, count);
  }

  // D. Generate 3D Holographic Envelope / Message Glyph
  function generateEmailPoints(count) {
    const raw = [];
    const w = 270;
    const h = 180;

    // Outer double frame
    for (let x = -w / 2; x <= w / 2; x += 1.4) {
      raw.push(x, -h / 2, 0);
      raw.push(x, h / 2, 0);
      raw.push(x, -h / 2 - 4, -4);
      raw.push(x, h / 2 + 4, -4);
    }
    for (let y = -h / 2; y <= h / 2; y += 1.4) {
      raw.push(-w / 2, y, 0);
      raw.push(w / 2, y, 0);
      raw.push(-w / 2 - 4, y, -4);
      raw.push(w / 2 + 4, y, -4);
    }

    // 3D Angled top flap with folded crease
    const flapApex = { x: 0, y: 15, z: 38 };
    for (let t = 0; t <= 1; t += 0.008) {
      raw.push(
        -w / 2 + (flapApex.x - (-w / 2)) * t,
        h / 2 + (flapApex.y - h / 2) * t,
        flapApex.z * t
      );
      raw.push(
        w / 2 + (flapApex.x - w / 2) * t,
        h / 2 + (flapApex.y - h / 2) * t,
        flapApex.z * t
      );
      // Bottom crease lines
      raw.push(
        -w / 2 + (0 - (-w / 2)) * t,
        -h / 2 + (-20 - (-h / 2)) * t,
        14 * t
      );
      raw.push(
        w / 2 + (0 - w / 2) * t,
        -h / 2 + (-20 - (-h / 2)) * t,
        14 * t
      );
    }

    // Interior surface fill with 2.5D curvature
    for (let y = -h / 2; y <= h / 2; y += 3.8) {
      for (let x = -w / 2; x <= w / 2; x += 3.8) {
        const dist = Math.abs(x) / (w / 2);
        raw.push(x, y, (1.0 - dist) * 16.0 + (Math.random() - 0.5) * 3);
      }
    }

    // Expanding transmission signal arcs above the envelope
    for (let arc = 1; arc <= 4; arc++) {
      const arcRadius = 75 + arc * 32;
      for (let angle = Math.PI * 0.22; angle <= Math.PI * 0.78; angle += 0.02) {
        raw.push(
          Math.cos(angle) * arcRadius,
          h / 2 + 15 + Math.sin(angle) * (arcRadius * 0.52),
          (Math.random() - 0.5) * 16
        );
      }
    }

    return fitPoints(raw, count);
  }

  // E. Generate Holographic Radar & Conversation Signal Beacon
  function generateContactPoints(count) {
    const raw = [];

    // Concentric radar rings
    [50, 95, 145, 195].forEach((r, idx) => {
      const step = 0.015 - idx * 0.002;
      for (let a = 0; a < Math.PI * 2; a += Math.max(0.008, step)) {
        raw.push(
          Math.cos(a) * r + (Math.random() - 0.5) * 2,
          Math.sin(a) * r + (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 15
        );
      }
    });

    // Crosshair telemetry axes
    for (let d = -205; d <= 205; d += 1.8) {
      raw.push(d, 0, (Math.random() - 0.5) * 5);
      raw.push(0, d, (Math.random() - 0.5) * 5);
    }

    // Central pulsing core sphere
    for (let i = 0; i < 650; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random()) * 30.0;
      raw.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
    }

    // Intersecting 3D dialogue speech bubbles
    for (let a = -Math.PI * 0.42; a <= Math.PI * 0.42; a += 0.02) {
      raw.push(
        75 + Math.cos(a) * 60,
        50 + Math.sin(a) * 60,
        25 + Math.sin(a * 2.0) * 12
      );
      raw.push(
        -75 - Math.cos(a) * 60,
        -50 - Math.sin(a) * 60,
        -25 - Math.sin(a * 2.0) * 12
      );
    }

    return fitPoints(raw, count);
  }

  // ---------------------------------------------------------------------------
  // 4. GPU Particle Engine Setup & Custom ShaderMaterial
  // ---------------------------------------------------------------------------
  let particleMesh = null;
  let posAttr = null;
  let targetAttr = null;

  const uniforms = {
    uTime: { value: 0.0 },
    uMorphProgress: { value: 1.0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uMouseSpeed: { value: 0.0 },
    uPusherRadius: { value: 180.0 },
    uPusherStrength: { value: 65.0 },
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
  window.addEventListener('pointermove', onPointerMove, { passive: true });

  function assembleParticleEngine() {
    shapeLibraries.github   = generateGitHubPoints(PARTICLE_COUNT);
    shapeLibraries.linkedin = generateLinkedInPoints(PARTICLE_COUNT);
    shapeLibraries.email    = generateEmailPoints(PARTICLE_COUNT);
    shapeLibraries.contact  = generateContactPoints(PARTICLE_COUNT);

    const initialPos = new Float32Array(shapeLibraries.avatar);
    const targetPos  = new Float32Array(shapeLibraries.avatar);

    const turbulence = new Float32Array(PARTICLE_COUNT * 3);
    const phases = new Float32Array(PARTICLE_COUNT);
    const sizes  = new Float32Array(PARTICLE_COUNT);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Deterministic 3D unit curl vectors for organic morph dispersion
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;
      turbulence[i * 3]     = Math.cos(phi) * Math.sin(theta);
      turbulence[i * 3 + 1] = Math.sin(phi);
      turbulence[i * 3 + 2] = Math.cos(phi) * Math.cos(theta);

      phases[i] = Math.random() * Math.PI * 2;
      // Rich particle size variation: 2.8 to 5.4 units
      sizes[i]  = Math.random() * 2.6 + 2.8;

      // Color palette mapping: luminous emerald, volt green, cyan, and white highlights
      const rand = Math.random();
      let col = COLOR_EMERALD;
      if (rand > 0.65) col = COLOR_CYAN;
      else if (rand > 0.28) col = COLOR_ACID;
      else if (rand > 0.12) col = COLOR_WHITE;
      else col = COLOR_SHADOW;

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
        varying float vPhase;

        void main() {
          vColor = aColor;
          vPhase = aPhase;

          // 1. Smooth Morphing with 3D Swirl & Curl Turbulence
          float t = smoothstep(0.0, 1.0, uMorphProgress);

          // Scattering envelope during mid-transition
          float scatter = sin(t * 3.14159265);
          float swirlAngle = scatter * 2.8 + aPhase;
          mat2 rot = mat2(cos(swirlAngle), -sin(swirlAngle), sin(swirlAngle), cos(swirlAngle));

          vec3 midScatter = aTurbulence * (scatter * 115.0);
          vec3 currentPos = mix(position, aTarget, t) + midScatter;
          currentPos.xy = mix(currentPos.xy, rot * currentPos.xy, scatter * 0.68);

          // 2. Organic Idle Breathing
          currentPos.y += sin(uTime * 1.5 + aPhase) * 2.4;
          currentPos.x += cos(uTime * 1.2 + aPhase) * 1.8;
          currentPos.z += sin(uTime * 1.0 + aPhase) * 2.6;

          // 3. Fluid Pusher Cursor Physics with Velocity Trails
          vec3 mouse3D = vec3(uMouse.x * 270.0, uMouse.y * 210.0, 20.0);
          vec3 toMouse = currentPos - mouse3D;
          float dist = length(toMouse.xy);
          float displacementGlow = 0.0;

          if (dist < uPusherRadius) {
            float influence = pow(1.0 - dist / uPusherRadius, 1.6);
            vec2 pushDir = normalize(toMouse.xy + vec2(0.001));

            // Fluid wave + turbulence around cursor
            float turb = uTime * 3.4 + aPhase;
            mat2 tRot = mat2(cos(turb), -sin(turb), sin(turb), cos(turb));
            vec2 swirledDir = tRot * pushDir;

            vec3 pushOffset = vec3(
              swirledDir * (influence * uPusherStrength * (1.0 + uMouseSpeed * 0.8)),
              influence * 28.0
            );
            currentPos += pushOffset;

            // Displaced particles glow intensely
            displacementGlow = influence * (1.0 + uMouseSpeed * 1.8);
          }
          vGlow = displacementGlow;

          // 4. Holographic Scanline Micro-Displacement
          float scan = sin(currentPos.y * 0.05 - uTime * 3.2 + aPhase * 0.6);
          currentPos.z += smoothstep(0.75, 1.0, scan) * 3.8;

          vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Size attenuation with bright halo expansion
          float pointScale = aSize * (480.0 / -mvPosition.z) * uPixelDensity;
          pointScale *= (1.0 + displacementGlow * 0.5);
          gl_PointSize = clamp(pointScale, 1.6, 22.0);

          vAlpha = 0.92 + 0.08 * sin(uTime * 2.0 + aPhase);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vGlow;
        varying float vAlpha;
        varying float vPhase;
        uniform float uTime;

        void main() {
          // Circular particle with anti-aliasing edge
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;

          // Soft luminous halo + bright center core
          float core = smoothstep(0.5, 0.0, d);
          float intenseCenter = pow(core, 2.0);
          vec3 finalColor = vColor * core + vec3(0.85, 1.0, 0.92) * intenseCenter * 0.75;

          // Physics-Driven Trail Glow
          if (vGlow > 0.01) {
            vec3 neonCyan = vec3(0.08, 0.92, 1.0);
            vec3 whiteFlash = vec3(1.0, 1.0, 1.0);
            finalColor = mix(finalColor, neonCyan, clamp(vGlow, 0.0, 1.0));
            finalColor += whiteFlash * (vGlow * 0.65);
          }

          // Subtle holographic shimmer
          float shimmer = 0.93 + 0.07 * sin(uTime * 24.0 + vPhase * 8.0);
          gl_FragColor = vec4(finalColor * shimmer * (vAlpha * core), vAlpha * core);
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
  // 5. Morphing Controller (GSAP Smooth Physical Transition)
  // ---------------------------------------------------------------------------
  let currentShapeKey = 'avatar';
  let isMorphing = false;

  function morphTo(shapeKey) {
    if (shapeKey === currentShapeKey || isMorphing || !shapeLibraries[shapeKey]) return;
    isMorphing = true;

    const sourceData = shapeLibraries[currentShapeKey];
    const targetData = shapeLibraries[shapeKey];

    posAttr.copyArray(sourceData);
    posAttr.needsUpdate = true;

    targetAttr.copyArray(targetData);
    targetAttr.needsUpdate = true;

    uniforms.uMorphProgress.value = 0.0;

    // Highlight active control tab pill
    document.querySelectorAll('.holo-tab-btn').forEach(btn => {
      const match = btn.getAttribute('data-shape') === shapeKey;
      btn.classList.toggle('border-[#35E89A]', match);
      btn.classList.toggle('text-[#A8FF35]', match);
      btn.classList.toggle('bg-[#35E89A]/20', match);
      btn.classList.toggle('border-neutral-800', !match);
      btn.classList.toggle('text-neutral-400', !match);
      btn.classList.toggle('bg-neutral-900/60', !match);
    });

    gsap.to(uniforms.uMorphProgress, {
      value: 1.0,
      duration: 1.3,
      ease: 'power2.inOut',
      onComplete: () => {
        currentShapeKey = shapeKey;
        posAttr.copyArray(targetData);
        posAttr.needsUpdate = true;
        isMorphing = false;
      }
    });
  }

  window.morphContactHologram = morphTo;

  // ---------------------------------------------------------------------------
  // 6. Unified 60 FPS Render Loop
  // ---------------------------------------------------------------------------
  let animId = 0;
  let isRunning = true;
  let isVisible = true;
  const clock = new THREE.Clock();

  function renderLoop() {
    if (!isRunning) return;
    animId = requestAnimationFrame(renderLoop);

    if (!isVisible) return; // Pause GPU work when scrolled out of view

    const elapsed = clock.getElapsedTime();
    uniforms.uTime.value = elapsed;
    beamMat.uniforms.uTime.value = elapsed;

    // Smooth Mouse Tracking
    mouse.prevX = mouse.x;
    mouse.prevY = mouse.y;
    mouse.x += (mouse.targetX - mouse.x) * 0.08;
    mouse.y += (mouse.targetY - mouse.y) * 0.08;
    uniforms.uMouse.value.set(mouse.x, mouse.y);

    const instantSpeed = Math.hypot(mouse.x - mouse.prevX, mouse.y - mouse.prevY) * 60;
    mouse.speed += (instantSpeed - mouse.speed) * 0.12;
    uniforms.uMouseSpeed.value = Math.min(2.5, mouse.speed);

    // Rotate Platform Stage Rings
    outerRing.rotation.z = elapsed * 0.22;
    midRing.rotation.z   = -elapsed * 0.35;
    coreRing.rotation.z  = elapsed * 0.48;

    // Pulse beacon ring scale
    const pulseScale = 1.0 + 0.3 * Math.sin(elapsed * 2.5);
    pulseRing.scale.set(pulseScale, pulseScale, 1.0);

    // Gentle 3D perspective rotation of the central sculpture
    if (particleMesh) {
      particleMesh.rotation.y = Math.sin(elapsed * 0.35) * 0.16 + mouse.x * 0.14;
      particleMesh.rotation.x = Math.cos(elapsed * 0.28) * 0.05 - mouse.y * 0.08;
    }

    // Camera subtle breathing parallax
    camera.position.x = mouse.x * 22;
    camera.position.y = 10 + mouse.y * 14;
    camera.lookAt(0, 10, 0);

    renderer.render(scene, camera);
  }

  // Viewport Observer: Pause when off-screen
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      isVisible = entry.isIntersecting;
    });
  }, { threshold: 0.05 });
  observer.observe(container);

  renderLoop();

  // Resize handler
  const onResize = () => {
    width = container.clientWidth || 1000;
    height = container.clientHeight || 720;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    uniforms.uPixelDensity.value = Math.min(window.devicePixelRatio || 1, 2);
  };
  window.addEventListener('resize', onResize, { passive: true });

  // ---------------------------------------------------------------------------
  // 7. Load Avatar Image & Initialize
  // ---------------------------------------------------------------------------
  const avatarImg = new Image();
  avatarImg.crossOrigin = 'anonymous';
  avatarImg.onload = () => {
    shapeLibraries.avatar = sampleAvatarPoints(avatarImg, PARTICLE_COUNT);
    assembleParticleEngine();
  };
  avatarImg.onerror = () => {
    // Procedural cylinder fallback if asset fails to load
    const dummy = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 90 * Math.sqrt(Math.random());
      const z = (Math.random() - 0.5) * 60;
      dummy.push(Math.cos(a) * r, (Math.random() - 0.5) * 220, z);
    }
    shapeLibraries.avatar = fitPoints(dummy, PARTICLE_COUNT);
    assembleParticleEngine();
  };
  avatarImg.src = 'assets/masked-operator-hero.png';

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    isRunning = false;
    cancelAnimationFrame(animId);
    observer.disconnect();
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('resize', onResize);
    renderer?.dispose();
  });
}
