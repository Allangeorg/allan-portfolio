const stage = document.getElementById("hero-avatar-stage");
const avatar = stage?.querySelector("img");

if (stage && avatar) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!reducedMotion.matches) {
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const current = {
      rotateX: 0,
      rotateY: 0,
      shiftX: 0,
      shiftY: 0,
      depth: 0,
      scale: 1,
      opacity: 1,
      glow: 0.12,
      glowX: 0,
      glowY: 0,
      glowOpacity: 1,
    };
    const target = { ...current };
    let pointerX = 0;
    let pointerY = 0;
    let pointerActive = false;
    let frame = 0;

    function updateTarget() {
      const rect = stage.getBoundingClientRect();
      const stageTop = rect.top + window.scrollY;
      const viewport = window.innerHeight || 1;
      const progress = clamp(
        (window.scrollY - (stageTop - viewport * 0.34)) / (viewport * 0.88),
        0,
        1,
      );
      const desktopTilt = window.innerWidth < 700 ? 0.65 : 1;
      const x = pointerActive ? pointerX : 0;
      const y = pointerActive ? pointerY : 0;

      target.rotateY = (-4 + progress * 34 + x * 9) * desktopTilt;
      target.rotateX = (progress * 9 - y * 6) * desktopTilt;
      target.shiftX = x * 8;
      target.shiftY = -progress * 34 + y * 5;
      target.depth = 18 - progress * 12;
      target.scale = 1 - progress * 0.045;
      target.opacity = 1 - progress * 0.16;
      target.glow = 0.12 + progress * 0.12;
      target.glowX = -x * 10;
      target.glowY = -progress * 7 - y * 5;
      target.glowOpacity = 1 - progress * 0.35;

      if (!frame) frame = window.requestAnimationFrame(render);
    }

    function render() {
      frame = 0;
      let needsAnotherFrame = false;

      for (const key of Object.keys(current)) {
        const next = current[key] + (target[key] - current[key]) * 0.14;
        current[key] = Math.abs(target[key] - next) < 0.01 ? target[key] : next;
        if (current[key] !== target[key]) needsAnotherFrame = true;
      }

      stage.style.setProperty("--avatar-rotate-x", `${current.rotateX.toFixed(2)}deg`);
      stage.style.setProperty("--avatar-rotate-y", `${current.rotateY.toFixed(2)}deg`);
      stage.style.setProperty("--avatar-shift-x", `${current.shiftX.toFixed(2)}px`);
      stage.style.setProperty("--avatar-shift-y", `${current.shiftY.toFixed(2)}px`);
      stage.style.setProperty("--avatar-depth", `${current.depth.toFixed(2)}px`);
      stage.style.setProperty("--avatar-scale", current.scale.toFixed(4));
      stage.style.setProperty("--avatar-opacity", current.opacity.toFixed(3));
      stage.style.setProperty("--avatar-glow", current.glow.toFixed(3));
      stage.style.setProperty("--glow-shift-x", `${current.glowX.toFixed(2)}px`);
      stage.style.setProperty("--glow-shift-y", `${current.glowY.toFixed(2)}px`);
      stage.style.setProperty("--avatar-glow-opacity", current.glowOpacity.toFixed(3));

      if (needsAnotherFrame) frame = window.requestAnimationFrame(render);
    }

    function onPointerMove(event) {
      if (event.pointerType && event.pointerType !== "mouse") return;

      const rect = stage.getBoundingClientRect();
      pointerX = clamp((event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2), -1, 1);
      pointerY = clamp((event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2), -1, 1);
      pointerActive = true;
      updateTarget();
    }

    function resetPointer() {
      pointerActive = false;
      pointerX = 0;
      pointerY = 0;
      updateTarget();
    }

    window.addEventListener("scroll", updateTarget, { passive: true });
    window.addEventListener("resize", updateTarget, { passive: true });
    stage.addEventListener("pointermove", onPointerMove, { passive: true });
    stage.addEventListener("pointerleave", resetPointer, { passive: true });
    updateTarget();
  }
}
