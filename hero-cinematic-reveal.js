/**
 * hero-cinematic-reveal.js
 * 
 * ALLAN GEORGE MATHEW — CINEMATIC HACKER IDENTITY EXPERIENCE
 * 
 * Upgraded WebGL particle self-portrait & scroll-driven 3D interaction.
 * 
 * Core Features:
 * 1. Opening Sequence (approx. 6 seconds):
 *    - Phase A (0–2s): Darkness & particle emergence. Name and avatar 100% hidden.
 *      Thousands of #A8FF35 (volt/acid) and #16D9FF (cyan) particles emerge from 3D space,
 *      drifting and swirling inward.
 *    - Phase B (2–4s): Particles converge onto the silhouette of Allan's masked hacker avatar
 *      with controlled dispersion, subtle turbulence, and 2.5D volumetric relief.
 *      Avatar image emerges smoothly with soft rim lighting (opacity 0 -> 1).
 *    - Phase C (3.5–6s): Coordinated name reveal (ALLAN GEORGE in crisp #F2F5F0 white,
 *      MATHEW in neon-green-to-emerald gradient #A8FF35 -> #35E89A).
 *    - Phase D (6s+): Stable hero resting state. Crisp readable HTML typography, sharp avatar,
 *      ambient drifting particle field, and smooth mouse 3D parallax.
 * 
 * 2. Scroll-Driven 3D Particle Effect (Signature Feature):
 *    - As the visitor scrolls down from the hero, the portrait and particle system
 *      respond progressively to scroll position (0.0 -> 1.0):
 *      * At scroll 0 (top): Particle portrait is assembled and stable.
 *      * As scroll begins: The sharp image dissolves as particles take over the form.
 *      * Particles explode outward through 3D depth space, swirling and flying past the camera.
 *      * Typography and columns translate with coordinated parallax.
 *      * Smooth, intentional, native, and 100% reversible when scrolling backward.
 * 
 * Powered by Three.js (GPU particles) + GSAP (master timeline) + Motion (micro-interactions).
 */

import * as THREE from 'three';
import { gsap } from 'gsap';
import { animate } from 'motion';

(function initHeroCinematicExperience() {
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
  // Reduced Motion Fallback: Show everything immediately and cleanly
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

  // Ensure initial hidden states are locked before animation begins
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
  // 1. Three.js 3D Particle Scene Setup (Wide Overflow Canvas)
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
  const camera = new THREE.PerspectiveCamera(45, canvasWidth / canvasHeight, 1, 3000);
  camera.position.z = 620;

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
  // 2. Uniforms & Interaction State
  // ---------------------------------------------------------------------------
  const uniforms = {
    uTime: { value: 0.0 },
    uProgress: { value: 0.0 },         // 0.0 -> 1.0 (Opening convergence)
    uParticleAlpha: { value: 0.0 },    // 0.0 -> 1.0 (Opening fade-in)
    uScrollProgress: { value: 0.0 },   // 0.0 -> 1.0 (Scroll-driven dispersion)
    uAmbientStrength: { value: 0.0 },  // Phase 4 ambient floating level
    uMouse: { value: new THREE.Vector2(0, 0) },
    uPixelDensity: { value: Math.min(window.devicePixelRatio || 1, 2) }
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

  // Native Scroll Progress Tracking (Interpolated in rAF loop)
  let targetScrollProgress = 0.0;
  let currentScrollProgress = 0.0;
  let isIntroCompleted = false;

  function updateScrollProgress() {
    const heroHeight = home.clientHeight || 800;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    // Normalized scroll range (0.0 to 1.0 over hero zone)
    targetScrollProgress = Math.min(1.0, Math.max(0.0, scrollY / (heroHeight * 0.85)));
  }
  window.addEventListener("scroll", updateScrollProgress, { passive: true });

  let pointsMesh = null;

  // ---------------------------------------------------------------------------
  // 3. Volumetric 2.5D Particle Sampling from Masked Operator Avatar
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

    const isMobile = window.innerWidth < 768;
    // Step size: 5 on desktop (~6,000 silhouette points), 8 on mobile (~2,400)
    const step = isMobile ? 8 : 5;
    const stageW = stage.clientWidth || 400;
    const stageH = stage.clientHeight || 500;
    const scaleFactor = Math.min(stageW / nw, stageH / nh) * 0.98;

    // Palette Colors
    const acidGreen = new THREE.Color(0xA8FF35);  // Primary: #A8FF35
    const emerald   = new THREE.Color(0x35E89A);  // Highlights: #35E89A
    const cyan      = new THREE.Color(0x16D9FF);  // Electric: #16D9FF

    // A. Sample Avatar Silhouette & Generate 2.5D Depth
    for (let y = 0; y < nh; y += step) {
      for (let x = 0; x < nw; x += step) {
        const idx = (y * nw + x) * 4;
        const a = imgData[idx + 3];
        if (a > 30) {
          const r = imgData[idx] / 255;
          const g = imgData[idx + 1] / 255;
          const b = imgData[idx + 2] / 255;
          const brightness = (r + g + b) / 3;

          // Normalized coordinates (-1 to 1) relative to subject center
          const nx = (x - nw / 2) / (nw / 2);
          const ny = (y - nh / 2) / (nh / 2);

          // 2.5D Volumetric Facial & Hood Contouring
          const faceDist = Math.sqrt(nx * nx * 1.5 + Math.pow(ny + 0.15, 2) * 2.1);
          let zRelief = Math.max(0.0, 1.0 - faceDist) * 54.0;

          // Mask & nose highlights project forward
          if (faceDist < 0.65) {
            zRelief += brightness * 26.0;
          }
          // Shoulders curve back into depth
          if (ny > 0.18) {
            zRelief -= (nx * nx) * 48.0;
          }
          // Hood rim wraps around
          if (faceDist > 0.65 && faceDist < 0.92 && ny < 0.2) {
            zRelief += 16.0;
          }
          const tz = zRelief + (Math.random() - 0.5) * 8.0;

          // 3D Target position perfectly aligned with DOM image
          const tx = (x - nw / 2) * scaleFactor;
          const ty = -(y - nh / 2) * scaleFactor - 14;

          // Widely scattered 3D origin in deep space
          const dist = 320 + Math.random() * 420;
          const theta = Math.random() * Math.PI * 2;
          const phi = (Math.random() - 0.5) * Math.PI;

          const ox = dist * Math.cos(phi) * Math.sin(theta);
          const oy = dist * Math.sin(phi);
          const oz = (Math.random() - 0.5) * 750 - 100;

          // Outward 3D dispersion vector for scroll interaction
          const dirLen = Math.sqrt(nx * nx + ny * ny) || 1.0;
          const dDirX = (nx / dirLen) * (0.8 + Math.random() * 0.4);
          const dDirY = (ny / dirLen) * (0.8 + Math.random() * 0.4);
          const dDirZ = 0.5 + Math.random() * 0.9; // Forward flight towards camera

          positions.push(ox, oy, oz);
          origins.push(ox, oy, oz);
          targets.push(tx, ty, tz);
          dispersionDirs.push(dDirX, dDirY, dDirZ);
          sizes.push(Math.random() * 2.4 + 1.8);
          phases.push(Math.random() * Math.PI * 2);
          isAvatarFlags.push(1.0);

          // Authentic Hacker Palette Mapping
          if (brightness < 0.18) {
            // Dark hood/jacket: deep emerald shadow
            colors.push(0.04, 0.20, 0.08);
          } else if (brightness > 0.62) {
            // Highlights, eyes, technical seams: brilliant acid green or electric cyan
            if (Math.random() > 0.35) {
              colors.push(acidGreen.r, acidGreen.g, acidGreen.b);
            } else {
              colors.push(cyan.r, cyan.g, cyan.b);
            }
          } else {
            // Midtones: rich emerald glow
            colors.push(emerald.r, emerald.g, emerald.b);
          }
        }
      }
    }

    // B. Add Ambient 3D Constellation / Cyber Starlight Particles
    const ambientCount = isMobile ? 800 : 1600;
    for (let i = 0; i < ambientCount; i++) {
      const dist = 140 + Math.random() * 560;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      const ox = dist * Math.cos(phi) * Math.sin(theta);
      const oy = dist * Math.sin(phi);
      const oz = (Math.random() - 0.5) * 850;

      const tx = ox * 0.72;
      const ty = oy * 0.72;
      const tz = oz * 0.65;

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

      // Starfield palette distribution
      const randColor = Math.random();
      if (randColor > 0.65) {
        colors.push(cyan.r, cyan.g, cyan.b);
      } else if (randColor > 0.2) {
        colors.push(acidGreen.r, acidGreen.g, acidGreen.b);
      } else {
        colors.push(0.95, 0.96, 0.94); // #F2F5F0 Starlight
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

    // Custom GPU Shader: Convergence + 2.5D Relief + Scroll Dispersion
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

        attribute vec3 aOrigin;
        attribute vec3 aTarget;
        attribute vec3 aDispersionDir;
        attribute vec3 aColor;
        attribute float aSize;
        attribute float aPhase;
        attribute float aIsAvatar;

        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = aColor;

          // 1. Opening Sequence Interpolation (uProgress: 0.0 -> 1.0)
          float openProg = smoothstep(0.0, 1.0, uProgress);

          // Vortex swirl during Phase 1 & 2
          float swirlAmount = (1.0 - openProg) * 2.4;
          float swirlAngle = swirlAmount * length(aOrigin.xy) * 0.0032 + uTime * 0.48 + aPhase;
          mat2 rot = mat2(cos(swirlAngle), -sin(swirlAngle), sin(swirlAngle), cos(swirlAngle));
          vec2 swirledOrigin = rot * aOrigin.xy;

          vec3 currentPos = mix(vec3(swirledOrigin, aOrigin.z), aTarget, openProg);

          // 2. Idle Organic Floating & Mouse Reaction
          if (openProg > 0.65) {
            float idleFactor = (openProg - 0.65) * 2.85;
            currentPos.x += sin(uTime * 1.3 + aPhase) * 2.2 * idleFactor;
            currentPos.y += cos(uTime * 1.0 + aPhase) * 2.5 * idleFactor;
            currentPos.z += sin(uTime * 0.85 + aPhase) * 3.0 * idleFactor;

            // Restrained 3D mouse repulsion
            vec2 diff = currentPos.xy - (uMouse * 190.0);
            float dist = length(diff);
            if (dist < 140.0) {
              float force = (1.0 - dist / 140.0) * 15.0 * idleFactor;
              currentPos.xy += normalize(diff) * force;
              currentPos.z += force * 2.4;
            }
          }

          // 3. SCROLL-DRIVEN 3D PARTICLE DISPERSION (Signature Feature)
          // As visitor scrolls, particles explode outward and forward through 3D depth space
          float scrollFactor = smoothstep(0.0, 1.0, uScrollProgress);
          if (scrollFactor > 0.001) {
            float disperseDist = scrollFactor * (220.0 + aPhase * 95.0);

            // 3D curl / spiral turbulence
            float curlAngle = scrollFactor * 3.2 + aPhase;
            mat2 scrollRot = mat2(cos(curlAngle), -sin(curlAngle), sin(curlAngle), cos(curlAngle));
            vec2 scrolledDir = scrollRot * aDispersionDir.xy;

            vec3 disperseOffset = vec3(
              scrolledDir * disperseDist,
              aDispersionDir.z * disperseDist * 1.8 + sin(uTime * 1.8 + aPhase) * 22.0 * scrollFactor
            );

            currentPos += disperseOffset;
          }

          vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Particle Size Attenuation
          float pointScale = aSize * (460.0 / -mvPosition.z) * uPixelDensity;
          pointScale *= mix(0.55, 1.0, openProg);
          pointScale *= (1.0 + scrollFactor * 0.45);
          gl_PointSize = clamp(pointScale, 1.2, 16.0);

          // Alpha Calculation
          float alpha = uParticleAlpha;
          if (aIsAvatar > 0.5) {
            if (openProg > 0.9) {
              float restingAlpha = mix(1.0, 0.45, uAmbientStrength);
              // As image dissolves on scroll, particle cloud brightens
              alpha *= mix(restingAlpha, 0.95, scrollFactor);
            }
          } else {
            // Ambient stars pulse gently
            alpha *= (0.55 + 0.45 * sin(uTime * 1.8 + aPhase));
          }

          // Smoothly fade out when scrolled far past hero
          alpha *= (1.0 - smoothstep(0.8, 1.0, uScrollProgress) * 0.85);

          vAlpha = alpha;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float smoothEdge = smoothstep(0.5, 0.06, d);
          gl_FragColor = vec4(vColor, vAlpha * smoothEdge);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    pointsMesh = new THREE.Points(geometry, material);
    scene.add(pointsMesh);

    // Launch Master 6-Second Timeline
    startCinematicTimeline();
  }

  // ---------------------------------------------------------------------------
  // 4. Render Loop & Scroll Interpolation (60/120 FPS)
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
    mouse.x += (mouse.targetX - mouse.x) * 0.06;
    mouse.y += (mouse.targetY - mouse.y) * 0.06;
    uniforms.uMouse.value.set(mouse.x, mouse.y);

    // Camera 3D Parallax Tilt
    camera.position.x = mouse.x * 24;
    camera.position.y = mouse.y * 18;
    camera.lookAt(0, -10, 0);

    // Smooth Scroll Progress Interpolation (Native & Reversible)
    currentScrollProgress += (targetScrollProgress - currentScrollProgress) * 0.08;
    uniforms.uScrollProgress.value = currentScrollProgress;

    // Coordinated Scroll DOM Transitions (Only active once intro is complete)
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
  // 5. GSAP Master 6-Second Cinematic Timeline
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
    // PHASE A — PARTICLES FIRST IN DARKNESS (0.0s – 2.0s)
    // Dark background. Avatar & name completely hidden.
    // #A8FF35 and #16D9FF particles emerge from deep 3D space and swirl inward.
    // =========================================================================
    tl.to(uniforms.uParticleAlpha, {
      value: 1.0,
      duration: 1.4,
      ease: "power2.inOut"
    }, 0.2);

    tl.to(uniforms.uProgress, {
      value: 0.28,
      duration: 2.0,
      ease: "power1.inOut"
    }, 0.0);

    // =========================================================================
    // PHASE B — PARTICLE SELF-PORTRAIT CONVERGENCE (2.0s – 4.0s)
    // Particles converge tightly onto the masked operator silhouette.
    // Avatar image gradually emerges with smooth opacity and soft rim lighting.
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
    // Line 1: ALLAN GEORGE (crisp #F2F5F0 white).
    // Line 2: MATHEW (neon-green-to-emerald gradient #A8FF35 -> #35E89A).
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
    // PHASE D — FINAL HERO STATE & SCROLL ACTIVATION (6.0s onward)
    // Particles settle into subtle ambient halo. Scroll effects become active.
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
  // 6. Motion (Restrained Micro-interactions on Hover)
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
