/**
 * hero-cinematic-reveal.js
 * 
 * Cinematic 4-Phase Hero Reveal for Allan George Mathew:
 * - Phase 1 (0–2s): Particles First in darkness. Avatar and name completely hidden.
 *   Thousands of tiny emerald & cyan particles emerge from 3D space, drifting and swirling.
 * - Phase 2 (2–4s): Particles converge onto the silhouette of the masked hacker avatar.
 *   Avatar smoothly emerges from the particle field (opacity 0 -> 1, soft rim light, sharp final image).
 * - Phase 3 (3.5–6s): Coordinated Name Reveal.
 *   "ALLAN GEORGE" (soft white) and "MATHEW" (neon-green-to-emerald gradient) reveal with deliberate delay.
 *   Supporting UI (academic details, arrow, disciplines) smoothly fade in.
 * - Phase 4 (6s+): Final Hero State.
 *   Avatar and name are 100% sharp and fully visible.
 *   Particles settle into a subtle, elegant ambient field with restrained mouse 3D parallax.
 * 
 * Powered by Three.js (3D GPU particles) + GSAP (master 6s cinematic timeline) + Motion (micro-interactions).
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

  // Failsafe timer (7.5s): guarantees hero elements are visible if WebGL context creation fails
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
  // 1. Three.js 3D Particle Scene Setup
  // ---------------------------------------------------------------------------
  const canvas = document.createElement("canvas");
  canvas.className = "absolute pointer-events-none z-20";
  canvas.style.position = "absolute";
  canvas.style.top = "-50px";
  canvas.style.left = "-60px";
  canvas.style.right = "-60px";
  canvas.style.bottom = "-50px";
  canvas.style.width = "calc(100% + 120px)";
  canvas.style.height = "calc(100% + 100px)";
  canvas.setAttribute("aria-hidden", "true");
  stage.style.position = "relative";
  stage.appendChild(canvas);

  let canvasWidth = (stage.clientWidth || 400) + 120;
  let canvasHeight = (stage.clientHeight || 500) + 100;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, canvasWidth / canvasHeight, 1, 2500);
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
  // 2. Particle Geometry & Sampling from Masked Operator Avatar
  // ---------------------------------------------------------------------------
  const uniforms = {
    uTime: { value: 0.0 },
    uProgress: { value: 0.0 },       // 0.0 -> 1.0 (Phase 1 to Phase 2 convergence)
    uParticleAlpha: { value: 0.0 },  // 0.0 -> 1.0 (Phase 1 fade in from darkness)
    uAmbientStrength: { value: 0.0 },// Phase 4 ambient floating level
    uMouse: { value: new THREE.Vector2(0, 0) },
    uPixelDensity: { value: Math.min(window.devicePixelRatio || 1, 2) }
  };

  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const onPointerMove = (e) => {
    const rect = stage.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    mouse.targetX = Math.max(-1, Math.min(1, nx));
    mouse.targetY = Math.max(-1, Math.min(1, ny));
  };
  window.addEventListener("pointermove", onPointerMove, { passive: true });

  let pointsMesh = null;

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
    const colors = [];
    const sizes = [];
    const phases = [];
    const isAvatarFlags = [];

    const isMobile = window.innerWidth < 768;
    const step = isMobile ? 8 : 5; // ~4,000 silhouette particles on desktop, ~2,200 on mobile
    const scaleFactor = Math.min((canvasWidth - 120) / nw, (canvasHeight - 100) / nh) * 0.95;

    // A. Sample Avatar Silhouette Points
    for (let y = 0; y < nh; y += step) {
      for (let x = 0; x < nw; x += step) {
        const idx = (y * nw + x) * 4;
        const a = imgData[idx + 3];
        if (a > 30) {
          const r = imgData[idx] / 255;
          const g = imgData[idx + 1] / 255;
          const b = imgData[idx + 2] / 255;
          const brightness = (r + g + b) / 3;

          // Target position: exact avatar silhouette in 3D
          const tx = (x - nw / 2) * scaleFactor;
          const ty = -(y - nh / 2) * scaleFactor - 15;
          const tz = (Math.random() - 0.5) * 30; // subtle 3D relief

          // Origin position: widely scattered in 3D darkness
          const dist = 280 + Math.random() * 320;
          const theta = Math.random() * Math.PI * 2;
          const phi = (Math.random() - 0.5) * Math.PI;

          const ox = dist * Math.cos(phi) * Math.sin(theta);
          const oy = dist * Math.sin(phi);
          const oz = (Math.random() - 0.5) * 600 - 80;

          positions.push(ox, oy, oz);
          origins.push(ox, oy, oz);
          targets.push(tx, ty, tz);
          sizes.push(Math.random() * 2.2 + 2.0);
          phases.push(Math.random() * Math.PI * 2);
          isAvatarFlags.push(1.0);

          // Emerald, cyan, and sampled highlights
          if (brightness < 0.15) {
            // Dark hoodie / mask: subtle emerald cyber shadow
            colors.push(0.02, 0.16, 0.08);
          } else if (brightness > 0.65) {
            // Highlights / eyes / cyber rim: brilliant neon emerald / cyan
            if (Math.random() > 0.4) {
              colors.push(0.0, 1.0, 0.53); // #00FF88
            } else {
              colors.push(0.0, 0.9, 1.0);  // #00E5FF
            }
          } else {
            // Midtones: authentic operator tones with restrained mint glow
            colors.push(r * 0.7 + 0.05, g * 0.9 + 0.15, b * 0.8 + 0.1);
          }
        }
      }
    }

    // B. Add ~1,200 Ambient Cosmic / Cyber Dust Particles
    const ambientCount = isMobile ? 600 : 1200;
    for (let i = 0; i < ambientCount; i++) {
      const dist = 120 + Math.random() * 480;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      const ox = dist * Math.cos(phi) * Math.sin(theta);
      const oy = dist * Math.sin(phi);
      const oz = (Math.random() - 0.5) * 700;

      // Ambient targets form a soft floating halo around the stage
      const tx = ox * 0.75;
      const ty = oy * 0.75;
      const tz = oz * 0.6;

      positions.push(ox, oy, oz);
      origins.push(ox, oy, oz);
      targets.push(tx, ty, tz);
      sizes.push(Math.random() * 1.8 + 1.2);
      phases.push(Math.random() * Math.PI * 2);
      isAvatarFlags.push(0.0);

      // Emerald and cyan ambient stars
      if (Math.random() > 0.5) {
        colors.push(0.0, 1.0, 0.53); // Emerald
      } else {
        colors.push(0.0, 0.85, 1.0); // Cyan
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("aOrigin", new THREE.Float32BufferAttribute(origins, 3));
    geometry.setAttribute("aTarget", new THREE.Float32BufferAttribute(targets, 3));
    geometry.setAttribute("aColor", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute("aSize", new THREE.Float32BufferAttribute(sizes, 1));
    geometry.setAttribute("aPhase", new THREE.Float32BufferAttribute(phases, 1));
    geometry.setAttribute("aIsAvatar", new THREE.Float32BufferAttribute(isAvatarFlags, 1));

    // Custom Shader for Cinematic 3D Dispersal, Convergence & Glow
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        uniform float uTime;
        uniform float uProgress;
        uniform float uParticleAlpha;
        uniform float uAmbientStrength;
        uniform vec2 uMouse;
        uniform float uPixelDensity;

        attribute vec3 aOrigin;
        attribute vec3 aTarget;
        attribute vec3 aColor;
        attribute float aSize;
        attribute float aPhase;
        attribute float aIsAvatar;

        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = aColor;

          // Non-linear easing for smooth convergence
          float prog = smoothstep(0.0, 1.0, uProgress);

          // 1. Swirl & Vortex motion during Phase 1 & 2
          float swirlAmount = (1.0 - prog) * 2.2;
          float swirlAngle = swirlAmount * length(aOrigin.xy) * 0.0035 + uTime * 0.5 + aPhase;
          mat2 rot = mat2(cos(swirlAngle), -sin(swirlAngle), sin(swirlAngle), cos(swirlAngle));
          vec2 swirledOrigin = rot * aOrigin.xy;

          // Interpolate from scattered origins to converged avatar targets
          vec3 currentPos = mix(vec3(swirledOrigin, aOrigin.z), aTarget, prog);

          // 2. Subtle organic floating motion once converged
          if (prog > 0.7) {
            float floatFactor = (prog - 0.7) * 3.33;
            currentPos.x += sin(uTime * 1.4 + aPhase) * 2.4 * floatFactor;
            currentPos.y += cos(uTime * 1.1 + aPhase) * 2.8 * floatFactor;
            currentPos.z += sin(uTime * 0.9 + aPhase) * 3.5 * floatFactor;

            // Restrained 3D mouse interaction
            vec2 diff = currentPos.xy - (uMouse * 180.0);
            float dist = length(diff);
            if (dist < 130.0) {
              float force = (1.0 - dist / 130.0) * 14.0 * floatFactor;
              currentPos.xy += normalize(diff) * force;
              currentPos.z += force * 2.2;
            }
          }

          vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Distance-based particle size attenuation
          float pointScale = aSize * (440.0 / -mvPosition.z) * uPixelDensity;
          // Particles start as tiny delicate pinpricks and grow into fullness
          pointScale *= mix(0.55, 1.0, prog);
          gl_PointSize = max(1.5, pointScale);

          // Alpha computation
          float baseAlpha = uParticleAlpha;
          // Avatar particles fade slightly after image resolves, leaving luminous contour
          if (aIsAvatar > 0.5 && prog > 0.9) {
            baseAlpha *= mix(1.0, 0.42, uAmbientStrength);
          }
          // Ambient stars pulse gently
          if (aIsAvatar < 0.5) {
            baseAlpha *= (0.6 + 0.4 * sin(uTime * 2.0 + aPhase));
          }

          vAlpha = baseAlpha;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          // Circular particle with anti-aliased soft glowing edges
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

    // Launch the Master 6-Second Coordinated Timeline
    startCinematicTimeline();
  }

  // ---------------------------------------------------------------------------
  // 3. Render Loop (Single GPU-Accelerated rAF Loop)
  // ---------------------------------------------------------------------------
  let animFrameId = 0;
  let isRunning = true;
  const clock = new THREE.Clock();

  function renderLoop() {
    if (!isRunning) return;
    animFrameId = requestAnimationFrame(renderLoop);

    const elapsed = clock.getElapsedTime();
    uniforms.uTime.value = elapsed;

    // Smooth mouse lerping
    mouse.x += (mouse.targetX - mouse.x) * 0.06;
    mouse.y += (mouse.targetY - mouse.y) * 0.06;
    uniforms.uMouse.value.set(mouse.x, mouse.y);

    // Subtle 3D parallax on camera
    camera.position.x = mouse.x * 22;
    camera.position.y = mouse.y * 18;
    camera.lookAt(0, -10, 0);

    renderer.render(scene, camera);
  }

  renderLoop();

  // Resize handler
  const onResize = () => {
    canvasWidth = (stage.clientWidth || 400) + 120;
    canvasHeight = (stage.clientHeight || 500) + 100;
    camera.aspect = canvasWidth / canvasHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvasWidth, canvasHeight, false);
    uniforms.uPixelDensity.value = Math.min(window.devicePixelRatio || 1, 2);
  };
  window.addEventListener("resize", onResize, { passive: true });

  // ---------------------------------------------------------------------------
  // 4. GSAP Master 6-Second Cinematic Timeline
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
    // PHASE 1 — PARTICLES FIRST (0.0s – 2.0s)
    // Dark background. Avatar & name completely hidden.
    // Emerald & cyan particles emerge from deep space and swirl inward.
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
    // PHASE 2 — AVATAR REVEAL (2.0s – 4.0s)
    // Particles converge tightly onto the masked operator silhouette.
    // Avatar image gradually emerges with smooth opacity and gentle scale.
    // =========================================================================
    tl.to(uniforms.uProgress, {
      value: 1.0,
      duration: 1.8,
      ease: "power3.inOut"
    }, 2.0);

    // Avatar image emerges gradually from the particle field
    tl.set(avatarImg, {
      visibility: "visible",
      opacity: 0,
      scale: 0.97,
      filter: "drop-shadow(0 0 25px rgba(0,255,136,0.3)) brightness(0.9)"
    }, 2.3);

    tl.to(avatarImg, {
      opacity: 1,
      scale: 1.0,
      filter: "drop-shadow(0 0 8px rgba(0,255,136,0.06)) brightness(1.0)",
      duration: 1.7,
      ease: "power2.inOut"
    }, 2.3);

    // =========================================================================
    // PHASE 3 — NAME REVEAL (3.5s – 6.0s)
    // Coordinated reveal of ALLAN GEORGE and MATHEW.
    // ALLAN GEORGE: soft white. MATHEW: neon-green-to-emerald gradient.
    // Crisp typography, zero excessive blur, deliberate delay.
    // =========================================================================
    // Line 1: ALLAN GEORGE (Soft White)
    tl.to(nameLine1, {
      opacity: 1,
      y: 0,
      duration: 1.3,
      ease: "power3.out"
    }, 3.5);

    // Line 2: MATHEW (Neon-Green-to-Emerald Gradient) following with deliberate delay
    tl.to(nameLine2, {
      opacity: 1,
      y: 0,
      duration: 1.3,
      ease: "power3.out"
    }, 3.85);

    // Supporting UI elements (Left badge, circular arrow, right pitch & disciplines)
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
    // PHASE 4 — FINAL HERO STATE (6.0s onward)
    // Particles settle into a subtle ambient field around the sharp avatar.
    // =========================================================================
    tl.to(uniforms.uAmbientStrength, {
      value: 1.0,
      duration: 1.4,
      ease: "power2.out"
    }, 5.0);

    // Initialize Motion micro-interactions once timeline reaches final phase
    tl.call(() => {
      initMotionMicroInteractions();
    }, null, 5.8);
  }

  // ---------------------------------------------------------------------------
  // 5. Motion (Restrained Micro-interactions on Hover)
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

  // Trigger particle system generation
  if (avatarImg.complete && avatarImg.naturalWidth) {
    buildParticleSystem(avatarImg);
  } else {
    avatarImg.addEventListener("load", () => {
      buildParticleSystem(avatarImg);
    }, { once: true });
  }

  // Cleanup on page unload
  window.addEventListener("beforeunload", () => {
    isRunning = false;
    cancelAnimationFrame(animFrameId);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("resize", onResize);
    renderer?.dispose();
  });
})();
