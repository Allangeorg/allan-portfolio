/**
 * hero-cinematic-reveal.js
 * 
 * ALLAN GEORGE MATHEW — CINEMATIC HACKER IDENTITY & HOLOGRAM PARTICLES VFX
 * 
 * Inspired by and adapted from the Hologram Particles VFX architecture (cortiz2894/hologram-particles).
 * Engineered for high-performance WebGL within Allan's personal engineering portfolio.
 * 
 * Signature VFX Capabilities:
 * 1. 3D Holographic Emitter Platform:
 *    - Concentric, counter-rotating cyber rings (#35E89A emerald, #16D9FF electric cyan).
 *    - Vertical hologram projection beam with smooth volumetric gradient.
 *    - Expanding electromagnetic pulse waves.
 * 
 * 2. Volumetric 2.5D Hologram Point Cloud:
 *    - High-density particles (~8,500 desktop / ~3,000 mobile) sampled from Allan's masked avatar.
 *    - 2.5D facial & hood relief normals for directional holographic lighting.
 *    - Vertical hologram scanline wave & subtle fractal turbulence.
 * 
 * 3. Fluid Pusher Physics & Displacement Glow:
 *    - Damped spring-damper cursor displacement with turbulence sweep.
 *    - Physics-driven glow: displaced particles flash with brilliant cyan-white energy
 *      and gracefully decay as they return to rest.
 * 
 * 4. Master Cinematic Timeline (approx. 6 seconds):
 *    - Phase A (0–2s): Darkness. Hologram platform powers on, swirling particles emerge.
 *    - Phase B (2–4s): Particles converge into the volumetric hacker silhouette. Avatar image materializes.
 *    - Phase C (3.5–6s): ALLAN GEORGE in white, MATHEW in neon emerald gradient.
 *    - Phase D (6s+): Stable resting state with fluid interactive cursor physics.
 * 
 * 5. Reversible Scroll-Driven 3D Dispersion:
 *    - Scrolling down dissolves the avatar image, exploding the particles outward in 3D depth.
 * 
 * 6. Accessibility & Resilience:
 *    - Full prefers-reduced-motion fallback.
 *    - Failsafe timeout to guarantee zero broken states.
 */

import * as THREE from 'three';
import { gsap } from 'gsap';
import { animate } from 'motion';

(function initHeroHologramExperience() {
  const home = document.getElementById("home");
  const stage = document.getElementById("hero-avatar-stage");
  const avatarImg = stage?.querySelector("img");
  const nameLine1 = document.getElementById("hero-name-line-1");
  const nameLine2 = document.getElementById("hero-name-line-2");
  const leftCol = document.getElementById("hero-left-col");
  const rightCol = document.getElementById("hero-right-col");

  if (!home || !stage || !avatarImg || !nameLine1 || !nameLine2) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------------------------------------------------------------------------
  // 1. Reduced-Motion Fallback
  // ---------------------------------------------------------------------------
  if (reducedMotion) {
    avatarImg.style.opacity = "1";
    avatarImg.style.visibility = "visible";
    avatarImg.style.transform = "none";
    nameLine1.style.opacity = "1";
    nameLine1.style.transform = "none";
    nameLine2.style.opacity = "1";
    nameLine2.style.transform = "none";
    if (leftCol) { leftCol.style.opacity = "1"; leftCol.style.transform = "none"; }
    if (rightCol) { rightCol.style.opacity = "1"; rightCol.style.transform = "none"; }
    return;
  }

  // Initial hidden state for the cinematic sequence
  avatarImg.style.opacity = "0";
  avatarImg.style.visibility = "hidden";
  avatarImg.style.transform = "scale(0.97)";
  nameLine1.style.opacity = "0";
  nameLine1.style.transform = "translateY(45px)";
  nameLine2.style.opacity = "0";
  nameLine2.style.transform = "translateY(45px)";
  if (leftCol) { leftCol.style.opacity = "0"; leftCol.style.transform = "translateY(20px)"; }
  if (rightCol) { rightCol.style.opacity = "0"; rightCol.style.transform = "translateY(20px)"; }

  // Failsafe timer (7.5s): guarantees hero elements are visible if WebGL fails
  const failsafeTimer = setTimeout(() => {
    revealInstantFallback();
  }, 7500);

  function revealInstantFallback() {
    avatarImg.style.visibility = "visible";
    avatarImg.style.opacity = "1";
    avatarImg.style.transform = "none";
    nameLine1.style.opacity = "1";
    nameLine1.style.transform = "none";
    nameLine2.style.opacity = "1";
    nameLine2.style.transform = "none";
    if (leftCol) { leftCol.style.opacity = "1"; leftCol.style.transform = "none"; }
    if (rightCol) { rightCol.style.opacity = "1"; rightCol.style.transform = "none"; }
  }

  // ---------------------------------------------------------------------------
  // 2. Three.js Canvas & Scene Setup
  // ---------------------------------------------------------------------------
  const canvas = document.createElement("canvas");
  canvas.className = "absolute pointer-events-none z-20";
  canvas.style.position = "absolute";
  canvas.style.top = "-160px";
  canvas.style.left = "-380px";
  canvas.style.right = "-380px";
  canvas.style.bottom = "-140px";
  canvas.style.width = "calc(100% + 760px)";
  canvas.style.height = "calc(100% + 300px)";
  canvas.setAttribute("aria-hidden", "true");
  stage.style.position = "relative";
  stage.appendChild(canvas);

  let canvasWidth = (stage.clientWidth || 400) + 760;
  let canvasHeight = (stage.clientHeight || 500) + 300;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, canvasWidth / canvasHeight, 1, 3500);
  camera.position.set(0, 0, 620);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
  } catch (err) {
    console.warn("WebGL not supported, falling back to static display:", err);
    revealInstantFallback();
    return;
  }

  renderer.setSize(canvasWidth, canvasHeight, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  // ---------------------------------------------------------------------------
  // 3. Hologram Colors & Uniforms
  // ---------------------------------------------------------------------------
  const COLOR_ACID    = new THREE.Color(0xA8FF35); // #A8FF35 volt green
  const COLOR_EMERALD = new THREE.Color(0x35E89A); // #35E89A emerald
  const COLOR_CYAN    = new THREE.Color(0x16D9FF); // #16D9FF electric cyan
  const COLOR_SHADOW  = new THREE.Color(0x062312); // Deep cyber shadow

  const uniforms = {
    uTime: { value: 0.0 },
    uProgress: { value: 0.0 },         // 0.0 -> 1.0 (Opening convergence)
    uParticleAlpha: { value: 0.0 },    // 0.0 -> 1.0 (Opening fade-in)
    uScrollProgress: { value: 0.0 },   // 0.0 -> 1.0 (Scroll-driven dispersion)
    uAmbientStrength: { value: 0.0 },  // Phase 4 ambient floating level
    uMouse: { value: new THREE.Vector2(0, 0) },
    uPixelDensity: { value: Math.min(window.devicePixelRatio || 1, 2) },
    uPusherRadius: { value: 165.0 },
    uPusherStrength: { value: 55.0 },
    uScanSpeed: { value: 2.8 }
  };

  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const onPointerMove = (e) => {
    const rect = stage.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    mouse.targetX = Math.max(-1.5, Math.min(1.5, nx));
    mouse.targetY = Math.max(-1.5, Math.min(1.5, ny));
  };
  window.addEventListener("pointermove", onPointerMove, { passive: true });

  // Native Scroll Progress Tracking
  let targetScrollProgress = 0.0;
  let currentScrollProgress = 0.0;
  let isIntroCompleted = false;

  function updateScrollProgress() {
    const heroHeight = home.clientHeight || 800;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    targetScrollProgress = Math.min(1.0, Math.max(0.0, scrollY / (heroHeight * 0.85)));
  }
  window.addEventListener("scroll", updateScrollProgress, { passive: true });

  // ---------------------------------------------------------------------------
  // 4. Hologram Circular Emitter Platform (Inspired by cortiz2894)
  // ---------------------------------------------------------------------------
  const platformGroup = new THREE.Group();
  scene.add(platformGroup);

  // Position platform at the base of the avatar stage
  const stageH = stage.clientHeight || 500;
  platformGroup.position.set(0, -stageH * 0.44, -15);
  platformGroup.rotation.x = Math.PI * 0.42; // Tilted perspective disc

  // A. Outer Cyan Ring
  const outerRingGeom = new THREE.RingGeometry(180, 184, 64);
  const outerRingMat = new THREE.MeshBasicMaterial({
    color: COLOR_CYAN,
    transparent: true,
    opacity: 0.0,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
  const outerRing = new THREE.Mesh(outerRingGeom, outerRingMat);
  platformGroup.add(outerRing);

  // B. Inner Emerald Ring with dashed technical segments
  const innerRingGeom = new THREE.RingGeometry(130, 133, 48);
  const innerRingMat = new THREE.MeshBasicMaterial({
    color: COLOR_EMERALD,
    transparent: true,
    opacity: 0.0,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
  const innerRing = new THREE.Mesh(innerRingGeom, innerRingMat);
  platformGroup.add(innerRing);

  // C. Core Acid Concentric Ring
  const coreRingGeom = new THREE.RingGeometry(80, 82, 36);
  const coreRingMat = new THREE.MeshBasicMaterial({
    color: COLOR_ACID,
    transparent: true,
    opacity: 0.0,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
  const coreRing = new THREE.Mesh(coreRingGeom, coreRingMat);
  platformGroup.add(coreRing);

  // D. Upward Holographic Projection Light Cylinder (Hologram Beam)
  const beamGeom = new THREE.CylinderGeometry(150, 180, 480, 32, 1, true);
  const beamMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: uniforms.uTime,
      uAlpha: { value: 0.0 }
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
      uniform float uAlpha;
      varying vec2 vUv;
      varying vec3 vNormal;
      void main() {
        // Vertical fade: bright at base, soft at top
        float vFade = pow(1.0 - vUv.y, 2.2);
        // Fresnel rim glow
        float rim = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.4);
        // Hologram scanlines
        float scan = sin(vUv.y * 55.0 - uTime * 4.0) * 0.15 + 0.85;
        vec3 col = mix(vec3(0.2, 0.95, 0.6), vec3(0.08, 0.85, 1.0), vUv.y);
        float alpha = vFade * rim * scan * uAlpha * 0.28;
        gl_FragColor = vec4(col * alpha, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
  const hologramBeam = new THREE.Mesh(beamGeom, beamMat);
  hologramBeam.rotation.x = -Math.PI * 0.42;
  hologramBeam.position.set(0, 240, 0);
  platformGroup.add(hologramBeam);

  let pointsMesh = null;

  // ---------------------------------------------------------------------------
  // 5. Volumetric 2.5D Hologram Point Cloud Generation
  // ---------------------------------------------------------------------------
  function buildParticleSystem(img) {
    const offscreen = document.createElement("canvas");
    const nw = img.naturalWidth || 600;
    const nh = img.naturalHeight || 750;
    offscreen.width = nw;
    offscreen.height = nh;
    const ctx = offscreen.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      revealInstantFallback();
      return;
    }

    ctx.drawImage(img, 0, 0, nw, nh);
    let imgData;
    try {
      imgData = ctx.getImageData(0, 0, nw, nh).data;
    } catch (_) {
      revealInstantFallback();
      return;
    }

    const positions = [];
    const origins = [];
    const targets = [];
    const dispersionDirs = [];
    const colors = [];
    const sizes = [];
    const phases = [];
    const isAvatarFlags = [];
    const normals = [];

    const isMobile = window.innerWidth < 768;
    // Step size: 4 on desktop (~8,500 points), 7 on mobile (~3,000 points)
    const step = isMobile ? 7 : 4;
    const stageW = stage.clientWidth || 400;
    const stageH = stage.clientHeight || 500;
    const scaleFactor = Math.min(stageW / nw, stageH / nh) * 0.98;

    // A. Sample Masked Avatar Silhouette & Construct Volumetric 2.5D Hologram
    for (let y = 0; y < nh; y += step) {
      for (let x = 0; x < nw; x += step) {
        const idx = (y * nw + x) * 4;
        const a = imgData[idx + 3];
        if (a > 25) {
          const r = imgData[idx] / 255;
          const g = imgData[idx + 1] / 255;
          const b = imgData[idx + 2] / 255;
          const brightness = (r + g + b) / 3;

          // Normalized coordinates (-1 to 1) relative to subject center
          const nx = (x - nw / 2) / (nw / 2);
          const ny = (y - nh / 2) / (nh / 2);

          // 2.5D Volumetric Contouring
          const faceDist = Math.sqrt(nx * nx * 1.5 + Math.pow(ny + 0.15, 2) * 2.1);
          let zRelief = Math.max(0.0, 1.0 - faceDist) * 58.0;

          // Forehead, visor, nose, and mask project forward
          if (faceDist < 0.65) {
            zRelief += brightness * 28.0;
          }
          // Torso & shoulders curve back into depth
          if (ny > 0.18) {
            zRelief -= (nx * nx) * 52.0;
          }
          // Hood edge wrap
          if (faceDist > 0.65 && faceDist < 0.92 && ny < 0.2) {
            zRelief += 18.0;
          }
          const tz = zRelief + (Math.random() - 0.5) * 8.0;

          // Target aligned with DOM image
          const tx = (x - nw / 2) * scaleFactor;
          const ty = -(y - nh / 2) * scaleFactor - 14;

          // Estimated normal for holographic lighting
          const normLen = Math.sqrt(nx * nx + ny * ny + 1.0);
          const normX = nx / normLen;
          const normY = -ny / normLen;
          const normZ = 1.0 / normLen;

          // Deep space origin for convergence
          const dist = 340 + Math.random() * 460;
          const theta = Math.random() * Math.PI * 2;
          const phi = (Math.random() - 0.5) * Math.PI;

          const ox = dist * Math.cos(phi) * Math.sin(theta);
          const oy = dist * Math.sin(phi);
          const oz = (Math.random() - 0.5) * 800 - 120;

          // Outward 3D dispersion vector for scroll interaction
          const dirLen = Math.sqrt(nx * nx + ny * ny) || 1.0;
          const dDirX = (nx / dirLen) * (0.85 + Math.random() * 0.4);
          const dDirY = (ny / dirLen) * (0.85 + Math.random() * 0.4);
          const dDirZ = 0.5 + Math.random() * 0.95;

          positions.push(ox, oy, oz);
          origins.push(ox, oy, oz);
          targets.push(tx, ty, tz);
          dispersionDirs.push(dDirX, dDirY, dDirZ);
          sizes.push(Math.random() * 2.2 + 1.9);
          phases.push(Math.random() * Math.PI * 2);
          isAvatarFlags.push(1.0);
          normals.push(normX, normY, normZ);

          // Authentic Hologram Palette Mapping
          if (brightness < 0.16) {
            // Shadow folds: deep cyber emerald
            colors.push(COLOR_SHADOW.r, COLOR_SHADOW.g, COLOR_SHADOW.b);
          } else if (brightness > 0.58) {
            // Highlights & visor seam: electric cyan / acid green flash
            if (Math.random() > 0.4) {
              colors.push(COLOR_ACID.r, COLOR_ACID.g, COLOR_ACID.b);
            } else {
              colors.push(COLOR_CYAN.r, COLOR_CYAN.g, COLOR_CYAN.b);
            }
          } else {
            // Midtones: radiant emerald
            colors.push(COLOR_EMERALD.r, COLOR_EMERALD.g, COLOR_EMERALD.b);
          }
        }
      }
    }

    // B. Add Holographic Base Emitter & Ambient Starlight Particles
    const ambientCount = isMobile ? 800 : 1800;
    for (let i = 0; i < ambientCount; i++) {
      const isEmitterSpark = i < ambientCount * 0.45;
      let ox, oy, oz, tx, ty, tz;

      if (isEmitterSpark) {
        // Sparks emerging from the circular hologram platform
        const r = Math.random() * 160;
        const angle = Math.random() * Math.PI * 2;
        tx = r * Math.cos(angle);
        ty = -stageH * 0.42 + Math.random() * 120;
        tz = r * Math.sin(angle) * 0.4;

        ox = tx * 1.5;
        oy = ty - 250 - Math.random() * 200;
        oz = tz * 1.5;
      } else {
        // Wide cyber constellation
        const dist = 140 + Math.random() * 580;
        const theta = Math.random() * Math.PI * 2;
        const phi = (Math.random() - 0.5) * Math.PI;

        ox = dist * Math.cos(phi) * Math.sin(theta);
        oy = dist * Math.sin(phi);
        oz = (Math.random() - 0.5) * 850;

        tx = ox * 0.75;
        ty = oy * 0.75;
        tz = oz * 0.70;
      }

      const dDirX = (Math.random() - 0.5) * 2.0;
      const dDirY = (Math.random() - 0.5) * 2.0;
      const dDirZ = 0.4 + Math.random() * 0.8;

      positions.push(ox, oy, oz);
      origins.push(ox, oy, oz);
      targets.push(tx, ty, tz);
      dispersionDirs.push(dDirX, dDirY, dDirZ);
      sizes.push(Math.random() * 2.0 + 1.2);
      phases.push(Math.random() * Math.PI * 2);
      isAvatarFlags.push(0.0);
      normals.push(0, 1, 0);

      const randCol = Math.random();
      if (randCol > 0.6) {
        colors.push(COLOR_CYAN.r, COLOR_CYAN.g, COLOR_CYAN.b);
      } else if (randCol > 0.2) {
        colors.push(COLOR_ACID.r, COLOR_ACID.g, COLOR_ACID.b);
      } else {
        colors.push(0.95, 0.98, 0.95);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("aOrigin", new THREE.Float32BufferAttribute(origins, 3));
    geometry.setAttribute("aTarget", new THREE.Float32BufferAttribute(targets, 3));
    geometry.setAttribute("aDispersionDir", new THREE.Float32BufferAttribute(dispersionDirs, 3));
    geometry.setAttribute("aColor", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute("aSize", new THREE.Float32BufferAttribute(sizes, 1));
    geometry.setAttribute("aPhase", new THREE.Float32BufferAttribute(phases, 1));
    geometry.setAttribute("aIsAvatar", new THREE.Float32BufferAttribute(isAvatarFlags, 1));
    geometry.setAttribute("aNormal", new THREE.Float32BufferAttribute(normals, 3));

    // -------------------------------------------------------------------------
    // 6. Hologram Particle Shader (TSL Node VFX converted to high-performance GLSL)
    // -------------------------------------------------------------------------
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        uniform float uTime;
        uniform float uProgress;
        uniform float uParticleAlpha;
        uniform float uScrollProgress;
        uniform float uAmbientStrength;
        uniform vec2 uMouse;
        uniform float uPixelDensity;
        uniform float uPusherRadius;
        uniform float uPusherStrength;
        uniform float uScanSpeed;

        attribute vec3 aOrigin;
        attribute vec3 aTarget;
        attribute vec3 aDispersionDir;
        attribute vec3 aColor;
        attribute float aSize;
        attribute float aPhase;
        attribute float aIsAvatar;
        attribute vec3 aNormal;

        varying vec3 vColor;
        varying float vAlpha;
        varying float vGlow;

        void main() {
          vColor = aColor;

          // 1. Opening Sequence Interpolation (uProgress: 0.0 -> 1.0)
          float openProg = smoothstep(0.0, 1.0, uProgress);

          // Vortex swirl during Phase 1 & 2
          float swirlAmount = (1.0 - openProg) * 2.5;
          float swirlAngle = swirlAmount * length(aOrigin.xy) * 0.003 + uTime * 0.45 + aPhase;
          mat2 rot = mat2(cos(swirlAngle), -sin(swirlAngle), sin(swirlAngle), cos(swirlAngle));
          vec2 swirledOrigin = rot * aOrigin.xy;

          vec3 currentPos = mix(vec3(swirledOrigin, aOrigin.z), aTarget, openProg);

          // 2. Holographic Scanline & Noise Displacement (from cortiz2894)
          if (openProg > 0.6) {
            float scanWave = sin(currentPos.y * 0.055 - uTime * uScanSpeed + aPhase * 0.8);
            float scanMod = smoothstep(0.65, 1.0, scanWave);
            // Micro-displacement along surface normal
            currentPos += aNormal * (scanMod * 3.2);

            // Subtle vertical holographic breathing
            currentPos.y += sin(uTime * 1.4 + aPhase) * 1.6;
            currentPos.x += cos(uTime * 1.1 + aPhase) * 1.2;
          }

          // 3. Fluid Pusher Cursor Physics with Spring-Damper Feel
          float displacementGlow = 0.0;
          if (openProg > 0.7) {
            vec3 mouse3D = vec3(uMouse.x * 240.0, uMouse.y * 200.0, 30.0);
            vec3 toParticle = currentPos - mouse3D;
            float dist = length(toParticle.xy);

            if (dist < uPusherRadius) {
              float influence = pow(1.0 - dist / uPusherRadius, 1.7);
              // Fluid wave + turbulence sweep
              float turbAngle = uTime * 3.0 + aPhase;
              mat2 turbRot = mat2(cos(turbAngle), -sin(turbAngle), sin(turbAngle), cos(turbAngle));
              vec2 pushedDir = turbRot * normalize(toParticle.xy + vec2(0.001));

              vec3 pushOffset = vec3(
                pushedDir * (influence * uPusherStrength),
                influence * 24.0
              );
              currentPos += pushOffset;

              // Physics glow: displaced particles illuminate intensely!
              displacementGlow = influence * 1.4;
            }
          }
          vGlow = displacementGlow;

          // 4. Scroll-Driven 3D Hologram Dispersion (Signature Feature)
          float scrollFactor = smoothstep(0.0, 1.0, uScrollProgress);
          if (scrollFactor > 0.001) {
            float disperseDist = scrollFactor * (240.0 + aPhase * 105.0);

            // 3D spiral turbulence
            float curlAngle = scrollFactor * 3.4 + aPhase;
            mat2 scrollRot = mat2(cos(curlAngle), -sin(curlAngle), sin(curlAngle), cos(curlAngle));
            vec2 scrolledDir = scrollRot * aDispersionDir.xy;

            vec3 disperseOffset = vec3(
              scrolledDir * disperseDist,
              aDispersionDir.z * disperseDist * 1.9 + sin(uTime * 1.8 + aPhase) * 24.0 * scrollFactor
            );
            currentPos += disperseOffset;
          }

          vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Particle Size Attenuation
          float pointScale = aSize * (480.0 / -mvPosition.z) * uPixelDensity;
          pointScale *= mix(0.5, 1.0, openProg);
          pointScale *= (1.0 + scrollFactor * 0.45);
          pointScale *= (1.0 + displacementGlow * 0.35); // Inflate size when pushed
          gl_PointSize = clamp(pointScale, 1.2, 18.0);

          // Alpha Calculation
          float alpha = uParticleAlpha;
          if (aIsAvatar > 0.5) {
            if (openProg > 0.9) {
              float restingAlpha = mix(1.0, 0.45, uAmbientStrength);
              alpha *= mix(restingAlpha, 0.95, scrollFactor);
            }
          } else {
            // Emitter sparks and ambient stars pulse
            alpha *= (0.55 + 0.45 * sin(uTime * 2.2 + aPhase));
          }

          // Smoothly fade out when scrolled far past hero
          alpha *= (1.0 - smoothstep(0.8, 1.0, uScrollProgress) * 0.85);

          vAlpha = alpha;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        varying float vGlow;
        uniform float uTime;

        void main() {
          // Circular particle with smooth anti-aliased edge
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float smoothEdge = smoothstep(0.5, 0.08, d);

          // Physics-Driven Holographic Glow (from cortiz2894)
          // Displaced particles flash bright electric cyan / white
          vec3 outColor = vColor;
          if (vGlow > 0.01) {
            vec3 neonCyan = vec3(0.08, 0.85, 1.0);
            vec3 whiteFlash = vec3(0.9, 1.0, 0.95);
            outColor = mix(outColor, neonCyan, clamp(vGlow, 0.0, 1.0));
            outColor += whiteFlash * (vGlow * 0.6);
          }

          // Holographic micro-flicker
          float flicker = 0.93 + 0.07 * sin(uTime * 32.0);

          gl_FragColor = vec4(outColor * flicker * (vAlpha * smoothEdge), vAlpha * smoothEdge);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    pointsMesh = new THREE.Points(geometry, material);
    scene.add(pointsMesh);

    // Launch Master Cinematic Timeline
    startCinematicTimeline();
  }

  // ---------------------------------------------------------------------------
  // 7. Render Loop (60/120 FPS)
  // ---------------------------------------------------------------------------
  let animFrameId = 0;
  let isRunning = true;
  const clock = new THREE.Clock();

  function renderLoop() {
    if (!isRunning) return;
    animFrameId = requestAnimationFrame(renderLoop);

    const elapsed = clock.getElapsedTime();
    uniforms.uTime.value = elapsed;

    // Smooth Mouse Lerping
    mouse.x += (mouse.targetX - mouse.x) * 0.07;
    mouse.y += (mouse.targetY - mouse.y) * 0.07;
    uniforms.uMouse.value.set(mouse.x, mouse.y);

    // Rotate Hologram Platform Rings (Counter-rotations)
    if (platformGroup) {
      outerRing.rotation.z = elapsed * 0.25;
      innerRing.rotation.z = -elapsed * 0.38;
      coreRing.rotation.z  = elapsed * 0.52;
    }

    // Camera 3D Parallax Tilt
    camera.position.x = mouse.x * 26;
    camera.position.y = mouse.y * 18;
    camera.lookAt(0, -10, 0);

    // Smooth Scroll Progress Interpolation
    currentScrollProgress += (targetScrollProgress - currentScrollProgress) * 0.08;
    uniforms.uScrollProgress.value = currentScrollProgress;

    // Coordinated Scroll DOM Transitions (Active after intro)
    if (isIntroCompleted) {
      // 1. Avatar Dissolve: image fades to 0 as particles explode in 3D
      const avatarFade = Math.max(0.0, 1.0 - currentScrollProgress * 2.4);
      avatarImg.style.opacity = avatarFade;
      avatarImg.style.transform = `scale(${1.0 - currentScrollProgress * 0.06})`;

      // 2. Name Parallax: smooth vertical translation and gentle fade
      const textOffset = -currentScrollProgress * 48;
      const textAlpha = Math.max(0.12, 1.0 - currentScrollProgress * 1.5);
      nameLine1.style.transform = `translateY(${textOffset}px)`;
      nameLine2.style.transform = `translateY(${textOffset * 1.25}px)`;
      nameLine1.style.opacity = textAlpha;
      nameLine2.style.opacity = textAlpha;

      // 3. Columns Parallax & Fade
      const colAlpha = Math.max(0.0, 1.0 - currentScrollProgress * 2.2);
      if (leftCol) {
        leftCol.style.opacity = colAlpha;
        leftCol.style.transform = `translateY(${-currentScrollProgress * 24}px)`;
      }
      if (rightCol) {
        rightCol.style.opacity = colAlpha;
        rightCol.style.transform = `translateY(${-currentScrollProgress * 24}px)`;
      }

      // 4. Platform Fade on Scroll
      const platAlpha = Math.max(0.0, 1.0 - currentScrollProgress * 2.0);
      outerRingMat.opacity = 0.55 * platAlpha;
      innerRingMat.opacity = 0.70 * platAlpha;
      coreRingMat.opacity  = 0.85 * platAlpha;
      beamMat.uniforms.uAlpha.value = platAlpha;
    }

    renderer.render(scene, camera);
  }

  renderLoop();

  // Resize handler
  const onResize = () => {
    canvasWidth = (stage.clientWidth || 400) + 760;
    canvasHeight = (stage.clientHeight || 500) + 300;
    camera.aspect = canvasWidth / canvasHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvasWidth, canvasHeight, false);
    uniforms.uPixelDensity.value = Math.min(window.devicePixelRatio || 1, 2);
    updateScrollProgress();
  };
  window.addEventListener("resize", onResize, { passive: true });

  // ---------------------------------------------------------------------------
  // 8. GSAP Master Cinematic Timeline
  // ---------------------------------------------------------------------------
  function startCinematicTimeline() {
    clearTimeout(failsafeTimer);

    const tl = gsap.timeline({
      defaults: { ease: "power2.out" }
    });
    window.__heroTimeline = tl;

    // Check for pauseAt testing parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("pauseAt")) {
      const seekTime = parseFloat(urlParams.get("pauseAt")) || 0;
      setTimeout(() => {
        tl.pause();
        tl.seek(seekTime);
      }, 50);
    }

    // =========================================================================
    // PHASE A — PARTICLES & HOLOGRAM PLATFORM POWER-ON (0.0s – 2.0s)
    // Dark environment. Avatar & name 100% hidden.
    // Hologram circular platform powers on. Particles emerge from deep space.
    // =========================================================================
    tl.to(outerRingMat, { opacity: 0.55, duration: 1.2, ease: "power2.inOut" }, 0.1);
    tl.to(innerRingMat, { opacity: 0.70, duration: 1.2, ease: "power2.inOut" }, 0.2);
    tl.to(coreRingMat,  { opacity: 0.85, duration: 1.2, ease: "power2.inOut" }, 0.3);
    tl.to(beamMat.uniforms.uAlpha, { value: 1.0, duration: 1.6, ease: "power2.inOut" }, 0.3);

    tl.to(uniforms.uParticleAlpha, {
      value: 1.0,
      duration: 1.4,
      ease: "power2.inOut"
    }, 0.2);

    tl.to(uniforms.uProgress, {
      value: 0.30,
      duration: 2.0,
      ease: "power1.inOut"
    }, 0.0);

    // =========================================================================
    // PHASE B — HOLOGRAM POINT CLOUD CONVERGENCE (2.0s – 4.0s)
    // Particles converge tightly onto the masked operator silhouette.
    // Avatar image gradually materializes with holographic emerald rim glow.
    // =========================================================================
    tl.to(uniforms.uProgress, {
      value: 1.0,
      duration: 1.8,
      ease: "power3.inOut"
    }, 2.0);

    tl.set(avatarImg, {
      visibility: "visible",
      opacity: 0,
      scale: 0.97,
      filter: "drop-shadow(0 0 25px rgba(53,232,154,0.35)) brightness(0.9)"
    }, 2.3);

    tl.to(avatarImg, {
      opacity: 1,
      scale: 1.0,
      filter: "drop-shadow(0 0 10px rgba(53,232,154,0.08)) brightness(1.0)",
      duration: 1.7,
      ease: "power2.inOut"
    }, 2.3);

    // =========================================================================
    // PHASE C — NAME REVEAL (3.5s – 6.0s)
    // Coordinated reveal of ALLAN GEORGE and MATHEW.
    // =========================================================================
    tl.to(nameLine1, {
      opacity: 1,
      y: 0,
      duration: 1.3,
      ease: "power3.out"
    }, 3.5);

    tl.to(nameLine2, {
      opacity: 1,
      y: 0,
      duration: 1.3,
      ease: "power3.out"
    }, 3.85);

    // Supporting UI (left badge/arrow & right intro/disciplines)
    if (leftCol) {
      tl.to(leftCol, {
        opacity: 1,
        y: 0,
        duration: 1.1,
        ease: "power2.out"
      }, 4.4);
    }

    if (rightCol) {
      tl.to(rightCol, {
        opacity: 1,
        y: 0,
        duration: 1.1,
        ease: "power2.out"
      }, 4.6);
    }

    // =========================================================================
    // PHASE D — FINAL RESTING STATE & INTERACTION ACTIVATION (6.0s onward)
    // =========================================================================
    tl.to(uniforms.uAmbientStrength, {
      value: 1.0,
      duration: 1.4,
      ease: "power2.out"
    }, 5.0);

    tl.call(() => {
      isIntroCompleted = true;
      initMotionMicroInteractions();
      updateScrollProgress();
    }, null, 5.8);
  }

  // ---------------------------------------------------------------------------
  // 9. Motion Micro-Interactions
  // ---------------------------------------------------------------------------
  function initMotionMicroInteractions() {
    try {
      const circleBtn = leftCol?.querySelector(".circle-btn");
      if (circleBtn) {
        circleBtn.addEventListener("mouseenter", () => {
          animate(circleBtn, { scale: 1.08 }, { duration: 0.25 });
        });
        circleBtn.addEventListener("mouseleave", () => {
          animate(circleBtn, { scale: 1.0 }, { duration: 0.25 });
        });
      }

      const disciplineLinks = rightCol?.querySelectorAll("a");
      disciplineLinks?.forEach(link => {
        link.addEventListener("mouseenter", () => {
          animate(link, { scale: 1.04 }, { duration: 0.2 });
        });
        link.addEventListener("mouseleave", () => {
          animate(link, { scale: 1.0 }, { duration: 0.2 });
        });
      });
    } catch (err) {
      console.warn("Motion micro-interactions note:", err);
    }
  }

  // Trigger Particle System Generation
  if (avatarImg.complete && avatarImg.naturalWidth) {
    buildParticleSystem(avatarImg);
  } else {
    avatarImg.addEventListener("load", () => {
      buildParticleSystem(avatarImg);
    }, { once: true });
  }

  // Cleanup on unload
  window.addEventListener("beforeunload", () => {
    isRunning = false;
    cancelAnimationFrame(animFrameId);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("scroll", updateScrollProgress);
    renderer?.dispose();
  });
})();
