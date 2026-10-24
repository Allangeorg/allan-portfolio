/**
 * contact-hologram-terminal.js
 * 
 * ALLAN GEORGE MATHEW — PRODUCTION 3D PARTICLE SCULPTURE & IGLOO STAGE
 * 
 * Production Improvements:
 * 1. Crisp Foreground Avatar Integration:
 *    - Real masked hacker avatar rendered as a crisp, recognizable foreground layer
 *      perfectly co-aligned with the Three.js 3D particle scaffold.
 *    - Fades gracefully into 3D particle vector shapes when navigating, and fades back in on return.
 * 
 * 2. Recognizable Logo Particle Targets (Pure Vector Silhouettes):
 *    - [0] Masked Hacker Avatar (default state)
 *    - [1] Official GitHub Octocat silhouette
 *    - [2] Official LinkedIn "in" emblem with rounded border tile
 *    - [3] Crisp 3D Email Envelope with triangular flap and internal crease lines
 *    - [4] Sleek Conversation Dialogue Beacon (dual message bubbles)
 * 
 * 3. Restrained, Cinematic Particle Motion:
 *    - Controlled 3D travel with per-particle phase stagger (0.95s duration, power2.inOut).
 *    - Restrained transit dispersion that smoothly locks into exact target positions.
 *    - Gentle cursor displacement that preserves symbol recognition.
 * 
 * 4. Polished 3D Igloo Concentric Platform:
 *    - Continuous 3D TorusGeometry rings (Cyan, Emerald, Volt) at y = -72.
 *    - Grounded reflective dark disc with subtle illumination.
 * 
 * 5. Viewport Fit & Responsive Sizing:
 *    - Normalized target coordinates (175 units) centered at y = 12.
 *    - Fits naturally within desktop 100dvh without clipping.
 */

import * as THREE from 'three';
import { gsap } from 'gsap';

export function initContactHologramTerminal(containerId = 'contact-stage-container') {
  const container = document.getElementById(containerId);
  const avatarDisplay = document.getElementById('contact-avatar-display');
  const fallbackImg = document.getElementById('contact-avatar-fallback');
  if (!container) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reduced motion: show clean static avatar preview
  if (reducedMotion) {
    if (avatarDisplay) avatarDisplay.style.opacity = '1';
    if (fallbackImg) fallbackImg.classList.remove('hidden');
    return;
  }

  // ---------------------------------------------------------------------------
  // 1. Three.js Scene, Camera & WebGL Renderer
  // ---------------------------------------------------------------------------
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x030504, 0.0012);

  let width = container.clientWidth || 800;
  let height = container.clientHeight || 450;

  // Balanced camera framing: sculpture occupies ~30% of stage width with generous breathing room
  const camera = new THREE.PerspectiveCamera(40, width / height, 1, 3000);
  camera.position.set(0, 18, 480);
  camera.lookAt(0, 12, 0);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
  } catch (err) {
    console.warn('WebGL not supported for contact sculpture:', err);
    if (avatarDisplay) avatarDisplay.style.opacity = '1';
    if (fallbackImg) fallbackImg.classList.remove('hidden');
    return;
  }

  renderer.setSize(width, height, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.inset = '0';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.pointerEvents = 'auto';
  renderer.domElement.style.zIndex = '5';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.appendChild(renderer.domElement);

  // Palette Constants
  const COLOR_ACID    = new THREE.Color(0xA8FF35); // #A8FF35 Volt green
  const COLOR_EMERALD = new THREE.Color(0x35E89A); // #35E89A Radiant emerald
  const COLOR_CYAN    = new THREE.Color(0x16D9FF); // #16D9FF Electric cyan
  const COLOR_WHITE   = new THREE.Color(0xF0FFFF); // #F0FFFF Highlight white

  const isMobile = window.innerWidth < 768;
  const PARTICLE_COUNT = isMobile ? 3800 : 7600;

  // ---------------------------------------------------------------------------
  // 2. Rebuilt Polished 3D Presentation Platform (Continuous Igloo Concentric Rings)
  // ---------------------------------------------------------------------------
  const platformGroup = new THREE.Group();
  platformGroup.position.set(0, -72, -10);
  platformGroup.rotation.x = Math.PI * 0.42; // Natural 42-degree perspective tilt
  scene.add(platformGroup);

  // A. Dark Reflective Ground Disc
  const groundDiscGeom = new THREE.CircleGeometry(120, 64);
  const groundDiscMat = new THREE.MeshBasicMaterial({
    color: 0x020804,
    transparent: true,
    opacity: 0.90,
    side: THREE.DoubleSide
  });
  const groundDisc = new THREE.Mesh(groundDiscGeom, groundDiscMat);
  platformGroup.add(groundDisc);

  // B. Soft Ground Halos beneath sculpture
  const groundHaloGeom = new THREE.RingGeometry(10, 115, 64);
  const groundHaloMat = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      void main() {
        float d = length(vUv - vec2(0.5)) * 2.0;
        float alpha = clamp(1.0 - d, 0.0, 1.0);
        alpha = pow(alpha, 1.6) * 0.40;
        vec3 col = mix(vec3(0.2, 0.98, 0.6), vec3(0.08, 0.85, 1.0), d);
        gl_FragColor = vec4(col * alpha, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
  const groundHalo = new THREE.Mesh(groundHaloGeom, groundHaloMat);
  groundHalo.position.z = 0.5;
  platformGroup.add(groundHalo);

  // C. Continuous 3D Concentric Torus Rings (Smooth tubular geometry, 128 segments)
  // Outer Electric Cyan Ring (radius 112)
  const outerRingGeom = new THREE.TorusGeometry(112, 1.5, 16, 128);
  const outerRingMat = new THREE.MeshBasicMaterial({
    color: COLOR_CYAN,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending
  });
  const outerRing = new THREE.Mesh(outerRingGeom, outerRingMat);
  outerRing.position.z = 1.0;
  platformGroup.add(outerRing);

  // Middle Radiant Emerald Ring (radius 84)
  const midRingGeom = new THREE.TorusGeometry(84, 1.6, 16, 128);
  const midRingMat = new THREE.MeshBasicMaterial({
    color: COLOR_EMERALD,
    transparent: true,
    opacity: 0.90,
    blending: THREE.AdditiveBlending
  });
  const midRing = new THREE.Mesh(midRingGeom, midRingMat);
  midRing.position.z = 1.3;
  platformGroup.add(midRing);

  // Inner Volt Green Core Ring (radius 56)
  const coreRingGeom = new THREE.TorusGeometry(56, 1.5, 16, 100);
  const coreRingMat = new THREE.MeshBasicMaterial({
    color: COLOR_ACID,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending
  });
  const coreRing = new THREE.Mesh(coreRingGeom, coreRingMat);
  coreRing.position.z = 1.6;
  platformGroup.add(coreRing);

  // ---------------------------------------------------------------------------
  // 3. Shape Point Generation: Avatar & Recognizable Vector Silhouettes
  // ---------------------------------------------------------------------------
  const SHAPES_CONFIG = [
    { key: 'avatar',   label: 'IDENTITY // MASKED AVATAR [1/5]' },
    { key: 'github',   label: 'PROJECTS // GITHUB [2/5]' },
    { key: 'linkedin', label: 'NETWORK // LINKEDIN [3/5]' },
    { key: 'email',    label: 'CHANNEL // EMAIL [4/5]' },
    { key: 'contact',  label: 'TRANSMISSION // CONTACT [5/5]' }
  ];

  const shapeLibraries = {
    avatar: null,
    github: null,
    linkedin: null,
    email: null,
    contact: null
  };

  // Helper to ensure target array has exactly PARTICLE_COUNT points uniformly distributed
  function fitPoints(raw, count) {
    const out = new Float32Array(count * 3);
    const n = Math.floor(raw.length / 3);
    if (n === 0) return out;

    if (n >= count) {
      // Downsample evenly across the entire source geometry
      const step = n / count;
      for (let i = 0; i < count; i++) {
        const srcIdx = Math.floor(i * step) * 3;
        out[i * 3]     = raw[srcIdx] + (Math.random() - 0.5) * 0.8;
        out[i * 3 + 1] = raw[srcIdx + 1] + (Math.random() - 0.5) * 0.8;
        out[i * 3 + 2] = raw[srcIdx + 2] + (Math.random() - 0.5) * 0.8;
      }
    } else {
      // Upsample: tile through source points and add subtle jitter
      for (let i = 0; i < count; i++) {
        const srcIdx = (i % n) * 3;
        out[i * 3]     = raw[srcIdx] + (Math.random() - 0.5) * 1.2;
        out[i * 3 + 1] = raw[srcIdx + 1] + (Math.random() - 0.5) * 1.2;
        out[i * 3 + 2] = raw[srcIdx + 2] + (Math.random() - 0.5) * 1.2;
      }
    }
    return out;
  }

  // A. Avatar Sampling: Accurate Masked Hacker Portrait
  function sampleAvatarPoints(img, count) {
    const off = document.createElement('canvas');
    const nw = img.naturalWidth || 1036;
    const nh = img.naturalHeight || 1519;
    off.width = nw;
    off.height = nh;
    const ctx = off.getContext('2d', { willReadFrequently: true });
    if (!ctx) return new Float32Array(count * 3);

    ctx.drawImage(img, 0, 0, nw, nh);
    const data = ctx.getImageData(0, 0, nw, nh).data;
    const raw = [];

    const bustScale = 0.22;
    const step = isMobile ? 4 : 3;

    for (let y = 0; y < nh; y += step) {
      const normY = y / nh; // 0.0 to 1.0
      // Anatomical boundary: bust exists down to ~0.64; below that is rectangular backdrop
      if (normY > 0.64) continue;

      for (let x = 0; x < nw; x += step) {
        const normX = (x - nw / 2) / (nw / 2); // -1.0 to 1.0
        const maxHalfWidth = 0.36 + normY * 0.92;
        if (Math.abs(normX) > maxHalfWidth) continue;

        const idx = (y * nw + x) * 4;
        const a = data[idx + 3];
        if (a > 28) {
          const r = data[idx] / 255;
          const g = data[idx + 1] / 255;
          const b = data[idx + 2] / 255;
          const brightness = (r + g + b) / 3;

          const px = (x - nw / 2) * bustScale;
          const py = -(y - nh * 0.38) * bustScale + 12;

          // 2.5D Volumetric Relief
          const faceDist = Math.sqrt(normX * normX * 1.6 + Math.pow(normY - 0.32, 2) * 2.8);
          let pz = Math.max(0.0, 1.0 - faceDist) * 32.0;

          // Visor & nose bridge project forward
          if (faceDist < 0.5) {
            pz += brightness * 20.0;
          }
          // Hood wraps forward around face
          if (faceDist > 0.52 && faceDist < 0.85 && normY < 0.42) {
            pz += 12.0;
          }
          // Shoulders curve back into depth
          if (normY > 0.45) {
            pz -= (normX * normX) * 32.0;
          }

          raw.push(px, py, pz);
        }
      }
    }
    return fitPoints(raw, count);
  }

  // Universal Vector Silhouette Sampler
  function sampleCanvasSilhouette(drawFn, count) {
    const cw = 400;
    const ch = 400;
    const off = document.createElement('canvas');
    off.width = cw;
    off.height = ch;
    const ctx = off.getContext('2d', { willReadFrequently: true });
    if (!ctx) return new Float32Array(count * 3);

    // Execute drawing routine
    drawFn(ctx, cw, ch);

    const data = ctx.getImageData(0, 0, cw, ch).data;
    const raw = [];

    // Find bounding box to normalize perfectly
    let minX = cw, maxX = 0, minY = ch, maxY = 0;
    for (let y = 0; y < ch; y += 2) {
      for (let x = 0; x < cw; x += 2) {
        const idx = (y * cw + x) * 4;
        const a = data[idx + 3];
        if (a > 35) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    const spanX = Math.max(1, maxX - minX);
    const spanY = Math.max(1, maxY - minY);
    const maxSpan = Math.max(spanX, spanY);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    const TARGET_SIZE = 175.0; // Uniform 175 units across all symbols
    const scale = TARGET_SIZE / maxSpan;

    for (let y = 0; y < ch; y += 2) {
      for (let x = 0; x < cw; x += 2) {
        const idx = (y * cw + x) * 4;
        const a = data[idx + 3];
        if (a > 35) {
          const normX = (x - cx) / (maxSpan / 2); // -1.0 to 1.0
          const normY = -(y - cy) / (maxSpan / 2); // -1.0 to 1.0

          const px = (x - cx) * scale;
          const py = -(y - cy) * scale + 12.0; // Centered above platform

          // Sculptural 2.5D depth
          const distFromCenter = Math.min(1.0, Math.hypot(normX, normY));
          const pz = (1.0 - distFromCenter * distFromCenter) * 16.0 * ((a / 255) * 0.8 + 0.2);

          raw.push(px, py, pz);
        }
      }
    }

    return fitPoints(raw, count);
  }

  // B. GitHub Octocat Silhouette (Official Path)
  function generateGitHubPoints(count) {
    return sampleCanvasSilhouette((ctx, w, h) => {
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(13.2, 13.2);
      ctx.translate(-12, -12); // Center 24x24 viewBox at (0, 0)
      const p = new Path2D("M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z");
      ctx.fillStyle = '#FFFFFF';
      ctx.fill(p);
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke(p);
      ctx.restore();
    }, count);
  }

  // C. LinkedIn Official Monogram & Badge
  function generateLinkedInPoints(count) {
    return sampleCanvasSilhouette((ctx, w, h) => {
      ctx.save();
      ctx.translate(w / 2, h / 2);

      // 1. Thick rounded square border
      const size = 180;
      const rad = 32;
      ctx.lineWidth = 14;
      ctx.strokeStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(-size / 2, -size / 2, size, size, rad);
      ctx.stroke();

      // 2. Letter "i": dot and stem
      ctx.fillStyle = '#FFFFFF';
      // Dot: circle at (-42, -36)
      ctx.beginPath();
      ctx.arc(-42, -36, 14, 0, Math.PI * 2);
      ctx.fill();
      // Stem: vertical bar from y = -16 to y = 52
      ctx.beginPath();
      ctx.roundRect(-54, -16, 24, 68, 5);
      ctx.fill();

      // 3. Letter "n": vertical stem + arch + right stem
      ctx.beginPath();
      ctx.roundRect(-16, -16, 24, 68, 5);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-16, 4);
      ctx.bezierCurveTo(-10, -20, 16, -20, 28, -6);
      ctx.bezierCurveTo(36, 2, 36, 18, 36, 52);
      ctx.lineTo(60, 52);
      ctx.lineTo(60, 10);
      ctx.bezierCurveTo(60, -8, 46, -20, 24, -20);
      ctx.bezierCurveTo(6, -20, -6, -8, -16, -2);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }, count);
  }

  // D. Email: Recognizable 3D Envelope
  function generateEmailPoints(count) {
    return sampleCanvasSilhouette((ctx, w, h) => {
      ctx.save();
      ctx.translate(w / 2, h / 2);

      const ew = 230;
      const eh = 150;
      const rad = 16;

      // 1. Envelope outer boundary (Thick crisp outline)
      ctx.lineWidth = 12;
      ctx.strokeStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(-ew / 2, -eh / 2, ew, eh, rad);
      ctx.stroke();

      // 2. Body fill for solid particle volume
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.roundRect(-ew / 2, -eh / 2, ew, eh, rad);
      ctx.fill();

      // 3. Top triangular flap fold (V-shape from top corners to center)
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(-ew / 2 + 8, -eh / 2 + 8);
      ctx.lineTo(0, 18);
      ctx.lineTo(ew / 2 - 8, -eh / 2 + 8);
      ctx.stroke();

      // 4. Bottom crease lines (from bottom corners meeting the center)
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(-ew / 2 + 8, eh / 2 - 8);
      ctx.lineTo(-24, 4);
      ctx.moveTo(ew / 2 - 8, eh / 2 - 8);
      ctx.lineTo(24, 4);
      ctx.stroke();

      ctx.restore();
    }, count);
  }

  // E. Contact: Sleek Conversation Dialogue Beacon
  function generateContactPoints(count) {
    return sampleCanvasSilhouette((ctx, w, h) => {
      ctx.save();
      ctx.translate(w / 2, h / 2);

      // Primary chat bubble
      ctx.lineWidth = 12;
      ctx.strokeStyle = '#FFFFFF';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';

      const bw = 180, bh = 130;
      ctx.beginPath();
      ctx.roundRect(-bw / 2 - 12, -bh / 2 - 10, bw, bh, 26);
      ctx.fill();
      ctx.stroke();

      // Speech tail
      ctx.beginPath();
      ctx.moveTo(-40, 55);
      ctx.lineTo(-75, 90);
      ctx.lineTo(-12, 55);
      ctx.closePath();
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.stroke();

      // 3 internal dots inside bubble
      ctx.fillStyle = '#FFFFFF';
      [-44, -12, 20].forEach(dx => {
        ctx.beginPath();
        ctx.arc(dx, -10, 10, 0, Math.PI * 2);
        ctx.fill();
      });

      // Secondary mini bubble at top right
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.roundRect(46, -92, 105, 72, 20);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }, count);
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
    uPusherRadius: { value: 90.0 },
    uPusherStrength: { value: 24.0 },
    uPixelDensity: { value: Math.min(window.devicePixelRatio || 1, 2) }
  };

  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0, prevX: 0, prevY: 0, speed: 0 };
  const onPointerMove = (e) => {
    const rect = container.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    mouse.targetX = Math.max(-1.2, Math.min(1.2, nx));
    mouse.targetY = Math.max(-1.2, Math.min(1.2, ny));
  };
  container.addEventListener('pointermove', onPointerMove, { passive: true });

  function assembleParticleEngine() {
    shapeLibraries.github   = generateGitHubPoints(PARTICLE_COUNT);
    shapeLibraries.linkedin = generateLinkedInPoints(PARTICLE_COUNT);
    shapeLibraries.email    = generateEmailPoints(PARTICLE_COUNT);
    shapeLibraries.contact  = generateContactPoints(PARTICLE_COUNT);

    const initialPos = new Float32Array(shapeLibraries.avatar);
    const targetPos  = new Float32Array(shapeLibraries.avatar);

    const turbulence = new Float32Array(PARTICLE_COUNT * 3);
    const phases = new Float32Array(PARTICLE_COUNT);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Controlled spherical transit vector
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      turbulence[i * 3]     = Math.sin(phi) * Math.cos(theta);
      turbulence[i * 3 + 1] = Math.sin(phi) * Math.sin(theta);
      turbulence[i * 3 + 2] = Math.cos(phi) * 1.5;

      phases[i] = Math.random();
      sizes[i] = isMobile ? 1.6 + Math.random() * 1.8 : 2.2 + Math.random() * 2.4;

      // Color distribution: Emerald, Cyan, Volt, White highlights
      const pColor = new THREE.Color();
      const rand = Math.random();
      if (rand < 0.45) {
        pColor.copy(COLOR_EMERALD).lerp(COLOR_CYAN, Math.random() * 0.4);
      } else if (rand < 0.78) {
        pColor.copy(COLOR_CYAN).lerp(COLOR_ACID, Math.random() * 0.3);
      } else if (rand < 0.92) {
        pColor.copy(COLOR_ACID);
      } else {
        pColor.copy(COLOR_WHITE);
      }
      colors[i * 3]     = pColor.r;
      colors[i * 3 + 1] = pColor.g;
      colors[i * 3 + 2] = pColor.b;
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

          // 1. Controlled Cinematic Morphing with Staggered Arrival
          float pProgress = clamp((uMorphProgress - aPhase * 0.18) / 0.82, 0.0, 1.0);
          float t = smoothstep(0.0, 1.0, pProgress);

          // Restrained 3D transit dispersion that smoothly locks into exact target position
          float midTransit = sin(t * 3.14159265);
          vec3 midScatter = aTurbulence * (midTransit * 16.0);
          midScatter.z += sin(t * 3.14159265) * 12.0 * (aPhase - 0.5);

          vec3 currentPos = mix(position, aTarget, t) + midScatter;

          // 2. Subtle Micro-Breathing
          currentPos.y += sin(uTime * 1.4 + aPhase * 6.28) * 1.2;
          currentPos.x += cos(uTime * 1.1 + aPhase * 6.28) * 0.8;

          // 3. Gentle Fluid Cursor Displacement (Yields gracefully, preserves shape)
          vec3 mouse3D = vec3(uMouse.x * 160.0, uMouse.y * 120.0, 10.0);
          vec3 toMouse = currentPos - mouse3D;
          float dist = length(toMouse.xy);
          float displacementGlow = 0.0;

          if (dist < uPusherRadius) {
            float influence = pow(1.0 - dist / uPusherRadius, 2.0);
            vec2 pushDir = normalize(toMouse.xy + vec2(0.001));
            currentPos.xy += pushDir * (influence * uPusherStrength * (1.0 + uMouseSpeed * 0.4));
            currentPos.z += influence * 8.0;
            displacementGlow = influence * 0.7;
          }
          vGlow = displacementGlow;

          // 4. Transform to screen space
          vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Attenuated point size
          float size = aSize * uPixelDensity;
          size *= (1.0 + displacementGlow * 0.35 + midTransit * 0.4);
          gl_PointSize = size * (380.0 / -mvPosition.z);

          // Depth fog alpha
          vAlpha = smoothstep(-1200.0, -100.0, mvPosition.z);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vGlow;
        varying float vAlpha;

        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;

          // Gaussian radiant point profile
          float core = smoothstep(0.5, 0.05, dist);
          float glow = exp(-dist * 4.2);
          float intensity = core * 0.75 + glow * 0.55;

          vec3 finalColor = vColor + vec3(vGlow * 0.35);
          gl_FragColor = vec4(finalColor * intensity, intensity * vAlpha * 0.92);
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
  // 5. Morphing Controller & Navigation State
  // ---------------------------------------------------------------------------
  let currentShapeIndex = 0;
  let isMorphing = false;

  function updateShapeUI(index) {
    const config = SHAPES_CONFIG[index];
    const indicator = document.getElementById('particle-shape-indicator');
    if (indicator) {
      indicator.textContent = config.label;
    }

    // Synchronize the crisp avatar foreground image
    if (avatarDisplay) {
      if (index === 0) {
        gsap.to(avatarDisplay, {
          opacity: 1,
          duration: 0.8,
          delay: 0.35,
          ease: 'power2.in',
          overwrite: 'auto'
        });
      } else {
        gsap.to(avatarDisplay, {
          opacity: 0,
          duration: 0.45,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      }
    }
  }

  function morphTo(shapeKey) {
    const targetIdx = SHAPES_CONFIG.findIndex(s => s.key === shapeKey);
    if (targetIdx === -1) return;
    morphToIndex(targetIdx);
  }

  function morphToIndex(index) {
    if (index === currentShapeIndex || isMorphing) return;
    const targetKey = SHAPES_CONFIG[index].key;
    if (!shapeLibraries[targetKey]) return;

    isMorphing = true;
    const currentKey = SHAPES_CONFIG[currentShapeIndex].key;
    const sourceData = shapeLibraries[currentKey];
    const targetData = shapeLibraries[targetKey];

    posAttr.copyArray(sourceData);
    posAttr.needsUpdate = true;

    targetAttr.copyArray(targetData);
    targetAttr.needsUpdate = true;

    uniforms.uMorphProgress.value = 0.0;
    updateShapeUI(index);

    // 0.95s cinematic morph transition
    gsap.to(uniforms.uMorphProgress, {
      value: 1.0,
      duration: 0.95,
      ease: 'power2.inOut',
      onComplete: () => {
        currentShapeIndex = index;
        posAttr.copyArray(targetData);
        posAttr.needsUpdate = true;
        isMorphing = false;
      }
    });
  }

  function prevShape() {
    const prev = (currentShapeIndex - 1 + SHAPES_CONFIG.length) % SHAPES_CONFIG.length;
    morphToIndex(prev);
  }

  function nextShape() {
    const next = (currentShapeIndex + 1) % SHAPES_CONFIG.length;
    morphToIndex(next);
  }

  // Bind Side Chevrons
  const prevBtn = document.getElementById('particle-prev-btn');
  const nextBtn = document.getElementById('particle-next-btn');
  if (prevBtn) prevBtn.addEventListener('click', prevShape);
  if (nextBtn) nextBtn.addEventListener('click', nextShape);

  // Keyboard Left / Right Navigation
  const onKeyDown = (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.key === 'ArrowLeft') {
      prevShape();
    } else if (e.key === 'ArrowRight') {
      nextShape();
    }
  };
  window.addEventListener('keydown', onKeyDown);

  // Expose global morph triggers
  window.morphContactHologram = morphTo;
  window.prevContactHologram  = prevShape;
  window.nextContactHologram  = nextShape;

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

    if (!isVisible) return; // Pause GPU rendering when scrolled out of view

    const elapsed = clock.getElapsedTime();
    uniforms.uTime.value = elapsed;

    // Smooth Mouse Tracking
    mouse.prevX = mouse.x;
    mouse.prevY = mouse.y;
    mouse.x += (mouse.targetX - mouse.x) * 0.08;
    mouse.y += (mouse.targetY - mouse.y) * 0.08;
    uniforms.uMouse.value.set(mouse.x, mouse.y);

    const instantSpeed = Math.hypot(mouse.x - mouse.prevX, mouse.y - mouse.prevY) * 60;
    mouse.speed += (instantSpeed - mouse.speed) * 0.12;
    uniforms.uMouseSpeed.value = Math.min(2.0, mouse.speed);

    // Rotate Platform Stage Rings (Smooth continuous counter-rotations)
    outerRing.rotation.z = elapsed * 0.14;
    midRing.rotation.z   = -elapsed * 0.20;
    coreRing.rotation.z  = elapsed * 0.30;

    // Subtle 3D perspective rotation of the central sculpture
    if (particleMesh) {
      particleMesh.rotation.y = Math.sin(elapsed * 0.32) * 0.12 + mouse.x * 0.10;
      particleMesh.rotation.x = Math.cos(elapsed * 0.25) * 0.04 - mouse.y * 0.06;
    }

    // Camera subtle breathing parallax
    camera.position.x = mouse.x * 16;
    camera.position.y = 18 + mouse.y * 10;
    camera.lookAt(0, 12, 0);

    renderer.render(scene, camera);
  }

  // Viewport Observer
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
    height = container.clientHeight || 450;
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

  function onAvatarLoaded() {
    try {
      shapeLibraries.avatar = sampleAvatarPoints(avatarImg, PARTICLE_COUNT);
      assembleParticleEngine();
      updateShapeUI(0);
    } catch (err) {
      console.warn('Avatar particle generation error:', err);
      if (avatarDisplay) avatarDisplay.style.opacity = '1';
      if (fallbackImg) fallbackImg.classList.remove('hidden');
    }
  }

  avatarImg.onload = onAvatarLoaded;
  avatarImg.onerror = () => {
    console.warn('Failed to load masked-operator-hero.png for contact terminal');
    if (avatarDisplay) avatarDisplay.style.opacity = '1';
    if (fallbackImg) fallbackImg.classList.remove('hidden');
  };

  if (avatarImg.complete && avatarImg.naturalWidth) {
    onAvatarLoaded();
  } else {
    avatarImg.src = 'assets/masked-operator-hero.png';
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    isRunning = false;
    cancelAnimationFrame(animId);
    observer.disconnect();
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('resize', onResize);
    renderer?.dispose();
  });
}
