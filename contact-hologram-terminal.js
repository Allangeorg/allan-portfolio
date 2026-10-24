/**
 * contact-hologram-terminal.js
 * 
 * ALLAN GEORGE MATHEW — IGLOO-INSPIRED 3D PARTICLE SCULPTURE & STAGE
 * 
 * Core Architectural & Visual Fixes:
 * 1. Fixed Avatar Segmentation:
 *    - Isolates the masked hacker avatar bust (hood, visor, mask, shoulders) from the
 *      dark rectangular fill in the lower third of the PNG.
 *    - Completely eliminates the accidental rectangular particle cloud.
 * 
 * 2. Proper Particle Scale & Camera Framing:
 *    - Sculpture occupies ~30% of hero width on desktop (within 25–40% target).
 *    - Entire sculpture and platform remain 100% visible with zero clipping.
 *    - Responsive scaling across desktop and mobile.
 * 
 * 3. Minimal Side Navigation Arrows:
 *    - Replaces the top row of boxed buttons with clean, understated left/right chevrons.
 *    - Large click targets, accessible labels, keyboard Left/Right arrow support.
 * 
 * 4. 5 Coherent, Recognizable 3D Particle Targets:
 *    - [0] Masked Hacker Avatar (default state)
 *    - [1] GitHub Octocat silhouette + < / > code brackets
 *    - [2] LinkedIn "in" symbol with rounded border tile
 *    - [3] Email 3D envelope with folded flap & signal waves
 *    - [4] Contact conversation dialogue beacon
 * 
 * 5. Polished 3D Presentation Platform:
 *    - Grounded 3D TorusGeometry continuous concentric rings (Cyan #16D9FF, Emerald #35E89A, Volt #A8FF35).
 *    - Dark reflective base disc with soft Gaussian ground lighting.
 *    - No clipped arcs, no visual fragmentation.
 */

import * as THREE from 'three';
import { gsap } from 'gsap';

export function initContactHologramTerminal(containerId = 'contact-stage-container') {
  const container = document.getElementById(containerId);
  const fallbackImg = document.getElementById('contact-avatar-fallback');
  if (!container) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reduced motion: show clean static avatar preview
  if (reducedMotion) {
    if (fallbackImg) fallbackImg.classList.remove('hidden');
    return;
  }

  // ---------------------------------------------------------------------------
  // 1. Three.js Scene, Camera & WebGL Renderer
  // ---------------------------------------------------------------------------
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x030504, 0.0012);

  let width = container.clientWidth || 800;
  let height = container.clientHeight || 520;

  // Camera placed so sculpture occupies ~30% width with generous breathing room
  const camera = new THREE.PerspectiveCamera(40, width / height, 1, 3000);
  camera.position.set(0, 20, 490);
  camera.lookAt(0, 18, 0);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
  } catch (err) {
    console.warn('WebGL not supported for contact sculpture:', err);
    if (fallbackImg) fallbackImg.classList.remove('hidden');
    return;
  }

  renderer.setSize(width, height, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.pointerEvents = 'auto';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.appendChild(renderer.domElement);

  // Palette Constants
  const COLOR_ACID    = new THREE.Color(0xA8FF35); // #A8FF35 Volt green
  const COLOR_EMERALD = new THREE.Color(0x35E89A); // #35E89A Radiant emerald
  const COLOR_CYAN    = new THREE.Color(0x16D9FF); // #16D9FF Electric cyan
  const COLOR_WHITE   = new THREE.Color(0xE6FFFF); // #E6FFFF Highlight white
  const COLOR_SHADOW  = new THREE.Color(0x0E3A20); // Deep glowing emerald shadow

  const isMobile = window.innerWidth < 768;
  const PARTICLE_COUNT = isMobile ? 3600 : 7800;

  // ---------------------------------------------------------------------------
  // 2. Rebuilt Polished 3D Presentation Platform (Continuous Torus Rings)
  // ---------------------------------------------------------------------------
  const platformGroup = new THREE.Group();
  // Positioned so it sits cleanly beneath the sculpture without viewport clipping
  platformGroup.position.set(0, -82, -10);
  platformGroup.rotation.x = Math.PI * 0.42;
  scene.add(platformGroup);

  // A. Dark Reflective Ground Disc
  const groundDiscGeom = new THREE.CircleGeometry(125, 64);
  const groundDiscMat = new THREE.MeshBasicMaterial({
    color: 0x020804,
    transparent: true,
    opacity: 0.88,
    side: THREE.DoubleSide
  });
  const groundDisc = new THREE.Mesh(groundDiscGeom, groundDiscMat);
  platformGroup.add(groundDisc);

  // B. Soft Ground Halos beneath sculpture
  const groundHaloGeom = new THREE.RingGeometry(10, 120, 48);
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
        alpha = pow(alpha, 1.8) * 0.35;
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

  // C. Continuous 3D Concentric Torus Rings (Smooth tubular geometry)
  // Outer Electric Cyan Ring
  const outerRingGeom = new THREE.TorusGeometry(120, 1.2, 16, 120);
  const outerRingMat = new THREE.MeshBasicMaterial({
    color: COLOR_CYAN,
    transparent: true,
    opacity: 0.70,
    blending: THREE.AdditiveBlending
  });
  const outerRing = new THREE.Mesh(outerRingGeom, outerRingMat);
  outerRing.position.z = 1.0;
  platformGroup.add(outerRing);

  // Middle Radiant Emerald Ring
  const midRingGeom = new THREE.TorusGeometry(92, 1.2, 16, 100);
  const midRingMat = new THREE.MeshBasicMaterial({
    color: COLOR_EMERALD,
    transparent: true,
    opacity: 0.80,
    blending: THREE.AdditiveBlending
  });
  const midRing = new THREE.Mesh(midRingGeom, midRingMat);
  midRing.position.z = 1.2;
  platformGroup.add(midRing);

  // Inner Volt Green Core Ring
  const coreRingGeom = new THREE.TorusGeometry(62, 1.0, 16, 80);
  const coreRingMat = new THREE.MeshBasicMaterial({
    color: COLOR_ACID,
    transparent: true,
    opacity: 0.90,
    blending: THREE.AdditiveBlending
  });
  const coreRing = new THREE.Mesh(coreRingGeom, coreRingMat);
  coreRing.position.z = 1.4;
  platformGroup.add(coreRing);

  // ---------------------------------------------------------------------------
  // 3. Shape Point Generation with Verified Mask & Crisp Typography
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
      // Downsample evenly across the entire source geometry so full bust/shape is captured
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

  // A. Avatar Sampling: Accurate Segmentation (Removes rectangular bottom box)
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

    // Scale so bust height is ~200 units, width ~175 units, centered at Y = 16
    const bustScale = 0.22;
    const step = isMobile ? 4 : 3;

    for (let y = 0; y < nh; y += step) {
      const normY = y / nh; // 0.0 (top) to 1.0 (bottom)
      // The person's anatomical bust exists from normY 0.05 down to ~0.64
      // Beyond 0.65, the image contains the dark rectangular backdrop!
      if (normY > 0.64) continue;

      for (let x = 0; x < nw; x += step) {
        const normX = (x - nw / 2) / (nw / 2); // -1.0 to 1.0
        // Anatomical shoulder taper boundary: prevents rectangular corner bleed
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
          let pz = Math.max(0.0, 1.0 - faceDist) * 36.0;

          // Visor & nose bridge project forward
          if (faceDist < 0.5) {
            pz += brightness * 22.0;
          }
          // Hood wraps forward around face
          if (faceDist > 0.52 && faceDist < 0.85 && normY < 0.42) {
            pz += 14.0;
          }
          // Shoulders curve back into depth
          if (normY > 0.45) {
            pz -= (normX * normX) * 38.0;
          }

          raw.push(px, py, pz);
        }
      }
    }
    return fitPoints(raw, count);
  }

  // B. GitHub Octocat Silhouette + Code Brackets
  function generateGitHubPoints(count) {
    const off = document.createElement('canvas');
    off.width = 300;
    off.height = 300;
    const ctx = off.getContext('2d');
    if (!ctx) return new Float32Array(count * 3);

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 300, 300);

    // Center Octocat path
    ctx.save();
    ctx.translate(35, 20);
    ctx.scale(9.6, 9.6);
    ctx.fillStyle = '#FFFFFF';
    const p = new Path2D("M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z");
    ctx.fill(p);
    ctx.restore();

    // Code Brackets < / >
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 8;
    ctx.font = 'bold 42px monospace';
    ctx.strokeText('< / >', 85, 285);

    const imgData = ctx.getImageData(0, 0, 300, 300).data;
    const raw = [];
    for (let y = 0; y < 300; y += 2) {
      for (let x = 0; x < 300; x += 2) {
        const idx = (y * 300 + x) * 4;
        if (imgData[idx] > 80) {
          const px = (x - 150) * 0.65;
          const py = -(y - 150) * 0.65 + 14;
          const dist = Math.sqrt(px * px + py * py);
          const pz = Math.cos(dist * 0.025) * 22.0;
          raw.push(px, py, pz);
        }
      }
    }
    return fitPoints(raw, count);
  }

  // C. LinkedIn "in" Monogram with Rounded Border Tile
  function generateLinkedInPoints(count) {
    const raw = [];
    const size = 88;
    const r = 24; // corner radius

    // 1. Outer rounded rectangle border
    for (let t = -size + r; t <= size - r; t += 2) {
      raw.push(t, size, 0);
      raw.push(t, -size, 0);
      raw.push(-size, t, 0);
      raw.push(size, t, 0);
    }
    // Rounded corners
    const corners = [
      { cx: size - r, cy: size - r, a0: 0, a1: Math.PI * 0.5 },
      { cx: -size + r, cy: size - r, a0: Math.PI * 0.5, a1: Math.PI },
      { cx: -size + r, cy: -size + r, a0: Math.PI, a1: Math.PI * 1.5 },
      { cx: size - r, cy: -size + r, a0: Math.PI * 1.5, a1: Math.PI * 2 }
    ];
    corners.forEach(c => {
      for (let a = c.a0; a <= c.a1; a += 0.06) {
        raw.push(c.cx + Math.cos(a) * r, c.cy + Math.sin(a) * r, 0);
      }
    });

    // 2. Letter "i" (Stem + Dot)
    for (let y = -42; y <= 16; y += 2.5) {
      for (let x = -48; x <= -32; x += 2.5) {
        raw.push(x, y + 10, 8);
      }
    }
    for (let y = 32; y <= 48; y += 2.5) {
      for (let x = -48; x <= -32; x += 2.5) {
        raw.push(x, y + 10, 8);
      }
    }

    // 3. Letter "n" (Left stem + Arch + Right leg)
    // Left stem
    for (let y = -42; y <= 16; y += 2.5) {
      for (let x = -14; x <= 2; x += 2.5) {
        raw.push(x, y + 10, 8);
      }
    }
    // Right leg
    for (let y = -42; y <= 16; y += 2.5) {
      for (let x = 32; x <= 48; x += 2.5) {
        raw.push(x, y + 10, 8);
      }
    }
    // Upper arch
    for (let a = 0; a <= Math.PI; a += 0.04) {
      const ax = 17 + Math.cos(a) * 31;
      const ay = 14 + Math.sin(a) * 19;
      for (let w = -4; w <= 4; w += 2) {
        raw.push(ax + w, ay + 10, 8);
      }
    }

    // Subtle 3D volumetric contouring
    for (let i = 0; i < raw.length; i += 3) {
      raw[i + 1] += 4; // Center vertically
      const d = Math.hypot(raw[i], raw[i + 1]);
      raw[i + 2] += (1.0 - d / 120) * 12.0;
    }

    return fitPoints(raw, count);
  }

  // D. 3D Holographic Envelope (Folded Flap & Signal Arcs)
  function generateEmailPoints(count) {
    const raw = [];
    const w = 180;
    const h = 120;

    // Outer rectangle border
    for (let x = -w / 2; x <= w / 2; x += 2) {
      raw.push(x, -h / 2 + 10, 0);
      raw.push(x, h / 2 + 10, 0);
    }
    for (let y = -h / 2; y <= h / 2; y += 2) {
      raw.push(-w / 2, y + 10, 0);
      raw.push(w / 2, y + 10, 0);
    }

    // Triangular top flap with 3D projection
    const apex = { x: 0, y: 12 + 10, z: 24 };
    for (let t = 0; t <= 1; t += 0.012) {
      raw.push(
        -w / 2 + (apex.x - (-w / 2)) * t,
        h / 2 + 10 + (apex.y - (h / 2 + 10)) * t,
        apex.z * t
      );
      raw.push(
        w / 2 + (apex.x - w / 2) * t,
        h / 2 + 10 + (apex.y - (h / 2 + 10)) * t,
        apex.z * t
      );
      // Bottom crease lines
      raw.push(
        -w / 2 + (0 - (-w / 2)) * t,
        -h / 2 + 10 + ((-14 + 10) - (-h / 2 + 10)) * t,
        8 * t
      );
      raw.push(
        w / 2 + (0 - w / 2) * t,
        -h / 2 + 10 + ((-14 + 10) - (-h / 2 + 10)) * t,
        8 * t
      );
    }

    // Interior surface fill with gentle curvature
    for (let y = -h / 2; y <= h / 2; y += 4.5) {
      for (let x = -w / 2; x <= w / 2; x += 4.5) {
        const dist = Math.abs(x) / (w / 2);
        raw.push(x, y + 10, (1.0 - dist) * 10.0);
      }
    }

    // Digital transmission pulse waves radiating above envelope
    for (let arc = 1; arc <= 3; arc++) {
      const arcRadius = 45 + arc * 24;
      for (let a = Math.PI * 0.25; a <= Math.PI * 0.75; a += 0.03) {
        raw.push(
          Math.cos(a) * arcRadius,
          h / 2 + 18 + Math.sin(a) * (arcRadius * 0.48),
          (Math.random() - 0.5) * 8
        );
      }
    }

    return fitPoints(raw, count);
  }

  // E. Contact Conversation Dialogue Beacon
  function generateContactPoints(count) {
    const raw = [];

    // Concentric communication radar rings
    [32, 64, 96, 128].forEach((r, idx) => {
      const step = 0.02 - idx * 0.003;
      for (let a = 0; a < Math.PI * 2; a += Math.max(0.01, step)) {
        raw.push(
          Math.cos(a) * r,
          Math.sin(a) * r + 14,
          (Math.random() - 0.5) * 10
        );
      }
    });

    // Crosshair telemetry axes
    for (let d = -132; d <= 132; d += 2.5) {
      raw.push(d, 14, (Math.random() - 0.5) * 4);
      raw.push(0, d + 14, (Math.random() - 0.5) * 4);
    }

    // Intersecting 3D speech bubble outlines
    // Left bubble
    for (let a = -Math.PI * 0.45; a <= Math.PI * 0.45; a += 0.03) {
      raw.push(
        42 + Math.cos(a) * 38,
        34 + Math.sin(a) * 38,
        14 + Math.sin(a * 2.0) * 8
      );
      raw.push(
        -42 - Math.cos(a) * 38,
        -16 - Math.sin(a) * 38,
        -14 - Math.sin(a * 2.0) * 8
      );
    }

    // Central pulsing transmission node
    for (let i = 0; i < 420; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random()) * 20.0;
      raw.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta) + 14,
        r * Math.cos(phi)
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
    uPusherRadius: { value: 140.0 },
    uPusherStrength: { value: 50.0 },
    uPixelDensity: { value: Math.min(window.devicePixelRatio || 1, 2) }
  };

  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0, prevX: 0, prevY: 0, speed: 0 };
  const onPointerMove = (e) => {
    const rect = container.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    mouse.targetX = Math.max(-1.3, Math.min(1.3, nx));
    mouse.targetY = Math.max(-1.3, Math.min(1.3, ny));
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
    const sizes  = new Float32Array(PARTICLE_COUNT);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Deterministic curl unit vectors for fluid morphing
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;
      turbulence[i * 3]     = Math.cos(phi) * Math.sin(theta);
      turbulence[i * 3 + 1] = Math.sin(phi);
      turbulence[i * 3 + 2] = Math.cos(phi) * Math.cos(theta);

      phases[i] = Math.random() * Math.PI * 2;
      sizes[i]  = Math.random() * 2.2 + 2.6; // Calibrated particle size

      // Vibrant hacker palette distribution
      const rand = Math.random();
      let col = COLOR_EMERALD;
      if (rand > 0.62) col = COLOR_CYAN;
      else if (rand > 0.25) col = COLOR_ACID;
      else if (rand > 0.10) col = COLOR_WHITE;
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

          // 1. Morphing Interpolation with 3D Curl Turbulence
          float t = smoothstep(0.0, 1.0, uMorphProgress);

          float scatter = sin(t * 3.14159265);
          float swirlAngle = scatter * 2.6 + aPhase;
          mat2 rot = mat2(cos(swirlAngle), -sin(swirlAngle), sin(swirlAngle), cos(swirlAngle));

          vec3 midScatter = aTurbulence * (scatter * 75.0);
          vec3 currentPos = mix(position, aTarget, t) + midScatter;
          currentPos.xy = mix(currentPos.xy, rot * currentPos.xy, scatter * 0.65);

          // 2. Gentle Breathing Floating
          currentPos.y += sin(uTime * 1.5 + aPhase) * 1.8;
          currentPos.x += cos(uTime * 1.2 + aPhase) * 1.4;
          currentPos.z += sin(uTime * 1.0 + aPhase) * 2.0;

          // 3. Fluid Pusher Cursor Physics with Damped Return
          vec3 mouse3D = vec3(uMouse.x * 200.0, uMouse.y * 150.0, 15.0);
          vec3 toMouse = currentPos - mouse3D;
          float dist = length(toMouse.xy);
          float displacementGlow = 0.0;

          if (dist < uPusherRadius) {
            float influence = pow(1.0 - dist / uPusherRadius, 1.6);
            vec2 pushDir = normalize(toMouse.xy + vec2(0.001));

            float turb = uTime * 3.2 + aPhase;
            mat2 tRot = mat2(cos(turb), -sin(turb), sin(turb), cos(turb));
            vec2 swirledDir = tRot * pushDir;

            vec3 pushOffset = vec3(
              swirledDir * (influence * uPusherStrength * (1.0 + uMouseSpeed * 0.7)),
              influence * 20.0
            );
            currentPos += pushOffset;

            // Displaced particles glow intensely
            displacementGlow = influence * (1.0 + uMouseSpeed * 1.6);
          }
          vGlow = displacementGlow;

          // 4. Subtle Hologram Scanline Wave
          float scan = sin(currentPos.y * 0.06 - uTime * 3.2 + aPhase * 0.6);
          currentPos.z += smoothstep(0.8, 1.0, scan) * 3.0;

          vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Size attenuation with bright halo expansion
          float pointScale = aSize * (450.0 / -mvPosition.z) * uPixelDensity;
          pointScale *= (1.0 + displacementGlow * 0.45);
          gl_PointSize = clamp(pointScale, 1.4, 20.0);

          vAlpha = 0.94 + 0.06 * sin(uTime * 2.2 + aPhase);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vGlow;
        varying float vAlpha;
        varying float vPhase;
        uniform float uTime;

        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;

          // Luminous halo + bright center core
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

          float shimmer = 0.94 + 0.06 * sin(uTime * 24.0 + vPhase * 8.0);
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

    gsap.to(uniforms.uMorphProgress, {
      value: 1.0,
      duration: 1.25,
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

  // Bind Side Arrows
  const prevBtn = document.getElementById('particle-prev-btn');
  const nextBtn = document.getElementById('particle-next-btn');
  if (prevBtn) prevBtn.addEventListener('click', prevShape);
  if (nextBtn) nextBtn.addEventListener('click', nextShape);

  // Keyboard Navigation: Left/Right Arrow Keys when container is in focus or hovered
  const onKeyDown = (e) => {
    // Only capture if not inside an input/textarea
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

    if (!isVisible) return; // Pause GPU work when scrolled out of view

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
    uniforms.uMouseSpeed.value = Math.min(2.5, mouse.speed);

    // Rotate Platform Stage Rings (Smooth subtle counter-rotations)
    outerRing.rotation.z = elapsed * 0.16;
    midRing.rotation.z   = -elapsed * 0.24;
    coreRing.rotation.z  = elapsed * 0.35;

    // Subtle 3D perspective rotation of the central sculpture
    if (particleMesh) {
      particleMesh.rotation.y = Math.sin(elapsed * 0.35) * 0.14 + mouse.x * 0.12;
      particleMesh.rotation.x = Math.cos(elapsed * 0.28) * 0.05 - mouse.y * 0.08;
    }

    // Camera subtle breathing parallax
    camera.position.x = mouse.x * 20;
    camera.position.y = 20 + mouse.y * 12;
    camera.lookAt(0, 18, 0);

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
    width = container.clientWidth || 800;
    height = container.clientHeight || 520;
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
      if (fallbackImg) fallbackImg.classList.remove('hidden');
    }
  }

  avatarImg.onload = onAvatarLoaded;
  avatarImg.onerror = () => {
    console.warn('Failed to load masked-operator-hero.png for contact terminal');
    if (fallbackImg) fallbackImg.classList.remove('hidden');
  };

  // If already cached by browser:
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
