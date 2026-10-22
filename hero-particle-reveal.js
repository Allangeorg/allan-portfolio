const home = document.getElementById("home");
const title = document.getElementById("hero-title");
const stage = document.getElementById("hero-avatar-stage");
const avatar = stage?.querySelector("img");
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

if (home && title && stage && avatar) {
  let dispose = () => {};

  function mountParticleReveal() {
    if (motionPreference.matches || !window.CanvasRenderingContext2D) return;

    const avatarCanvas = document.createElement("canvas");
    const titleCanvas = document.createElement("canvas");
    avatarCanvas.className = "hero-avatar-particles";
    titleCanvas.className = "hero-title-particles";
    avatarCanvas.setAttribute("aria-hidden", "true");
    titleCanvas.setAttribute("aria-hidden", "true");
    stage.append(avatarCanvas);
    title.append(titleCanvas);

    const avatarContext = avatarCanvas.getContext("2d", { alpha: true });
    const titleContext = titleCanvas.getContext("2d", { alpha: true });
    if (!avatarContext || !titleContext) {
      avatarCanvas.remove();
      titleCanvas.remove();
      return;
    }

    const smallScreen = window.matchMedia("(max-width: 600px)").matches;
    const cores = navigator.hardwareConcurrency || 4;
    const avatarLimit = Math.min(smallScreen ? 1650 : 3400, cores <= 4 ? 2200 : 3400);
    const titleLimit = smallScreen ? 620 : 1250;
    const colors = ["#a8ff48", "#68f5ad", "#46e9e2", "#d6ffd0"];
    let avatarPoints = [];
    let titlePoints = [];
    let width = 0;
    let height = 0;
    let titleWidth = 0;
    let titleHeight = 0;
    let elapsed = 0;
    let lastFrame = 0;
    let lastInteraction = 0;
    let frame = 0;
    let active = false;
    let pointerInitialized = false;
    let pointerX = 0;
    let pointerY = 0;
    let titlePointerX = 0;
    let titlePointerY = 0;
    let pointerPower = 0;
    let inView = !("IntersectionObserver" in window);
    let pageVisible = document.visibilityState !== "hidden";
    let destroyed = false;

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const smooth = (value) => {
      const t = clamp(value, 0, 1);
      return t * t * (3 - 2 * t);
    };

    function setCanvasSize(canvas, context, box) {
      const bounds = box.getBoundingClientRect();
      const nextWidth = Math.max(1, bounds.width);
      const nextHeight = Math.max(1, bounds.height);
      const ratio = Math.min(window.devicePixelRatio || 1, smallScreen ? 1.35 : 1.6);
      if (
        canvas.width !== Math.round(nextWidth * ratio) ||
        canvas.height !== Math.round(nextHeight * ratio)
      ) {
        canvas.width = Math.round(nextWidth * ratio);
        canvas.height = Math.round(nextHeight * ratio);
      }
      canvas.style.width = `${nextWidth}px`;
      canvas.style.height = `${nextHeight}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      return { width: nextWidth, height: nextHeight };
    }

    function sampleAvatar() {
      if (!avatar.naturalWidth || !avatar.naturalHeight || !width || !height) return;
      const source = document.createElement("canvas");
      source.width = avatar.naturalWidth;
      source.height = avatar.naturalHeight;
      const context = source.getContext("2d", { willReadFrequently: true });
      if (!context) return;

      try {
        context.drawImage(avatar, 0, 0);
        const pixels = context.getImageData(0, 0, source.width, source.height).data;
        const scale = Math.min(width / source.width, height / source.height);
        const drawWidth = source.width * scale;
        const drawHeight = source.height * scale;
        const offsetX = (width - drawWidth) / 2;
        const offsetY = height - drawHeight;
        const step = 6;
        const samples = [];

        for (let y = 0; y < source.height; y += step) {
          for (let x = 0; x < source.width; x += step) {
            const index = (y * source.width + x) * 4;
            if (pixels[index + 3] < 92) continue;
            const nx = (offsetX + x * scale) / width;
            const ny = (offsetY + y * scale) / height;
            const colorIndex = nx < 0.36 ? 0 : nx > 0.64 ? 2 : (y % 3 ? 1 : 3);
            const edge =
              x < step || x + step >= source.width || y < step || y + step >= source.height ||
              pixels[(y * source.width + x - step) * 4 + 3] < 92 ||
              pixels[(y * source.width + x + step) * 4 + 3] < 92 ||
              pixels[((y - step) * source.width + x) * 4 + 3] < 92 ||
              pixels[((y + step) * source.width + x) * 4 + 3] < 92;
            samples.push({
              x: nx,
              y: ny,
              color: colors[colorIndex],
              size: 0.65 + (pixels[index + 3] / 255) * 0.72,
              edge,
              phase: Math.random() * Math.PI * 2,
              delay: Math.random() * 0.38,
              scatterX: (Math.random() - 0.5) * 0.9,
              scatterY: (Math.random() - 0.5) * 0.78,
            });
          }
        }

        const stride = Math.max(1, Math.ceil(samples.length / avatarLimit));
        avatarPoints = samples.filter((_, index) => index % stride === 0).slice(0, avatarLimit);
      } catch {
        avatarPoints = [];
      }
    }

    function sampleTitle() {
      const rect = title.getBoundingClientRect();
      titleWidth = Math.max(1, rect.width);
      titleHeight = Math.max(1, rect.height);
      if (!titleWidth || !titleHeight) return;

      const source = document.createElement("canvas");
      source.width = Math.ceil(titleWidth);
      source.height = Math.ceil(titleHeight);
      const context = source.getContext("2d", { willReadFrequently: true });
      if (!context) return;

      const style = getComputedStyle(title);
      context.clearRect(0, 0, source.width, source.height);
      context.font = style.font;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = "#fff";
      const lineElements = Array.from(title.children).filter((child) => child.tagName !== "CANVAS");

      for (const line of lineElements) {
        const lineRect = line.getBoundingClientRect();
        const text = line.textContent.trim().replace(/\s+/g, " ");
        if (!text) continue;
        context.fillText(
          text,
          lineRect.left - rect.left + lineRect.width / 2,
          lineRect.top - rect.top + lineRect.height / 2,
          Math.max(1, lineRect.width),
        );
      }

      const pixels = context.getImageData(0, 0, source.width, source.height).data;
      const step = 3;
      const samples = [];
      for (let y = 0; y < source.height; y += step) {
        for (let x = 0; x < source.width; x += step) {
          const alpha = pixels[(y * source.width + x) * 4 + 3];
          if (alpha < 80) continue;
          samples.push({
            x: x / titleWidth,
            y: y / titleHeight,
            color: y / titleHeight > 0.53 ? colors[0] : colors[3],
            size: 0.7 + (alpha / 255) * 0.72,
            phase: Math.random() * Math.PI * 2,
            delay: Math.random() * 0.26,
            scatterX: (Math.random() - 0.5) * 0.55,
            scatterY: (Math.random() - 0.5) * 1.15,
          });
        }
      }
      const stride = Math.max(1, Math.ceil(samples.length / titleLimit));
      titlePoints = samples.filter((_, index) => index % stride === 0).slice(0, titleLimit);
    }

    function resize() {
      const avatarSize = setCanvasSize(avatarCanvas, avatarContext, stage);
      width = avatarSize.width;
      height = avatarSize.height;
      setCanvasSize(titleCanvas, titleContext, title);
      sampleAvatar();
      sampleTitle();
      if (active && inView && pageVisible) beginFrame();
    }

    function drawPoints(context, points, w, h, duration, time, options = {}) {
      const {
        radiusFactor = 1,
        restingOpacity = 0.1,
        edgeRestingOpacity = restingOpacity,
        settledStride = 1,
        opacity = 1,
        cursorX = -1000,
        cursorY = -1000,
        cursorRadius = 0,
        cursorStrength = 0,
      } = options;
      const transition = clamp(time / duration, 0, 1);
      const settle = smooth((time - duration) / 1.1);
      for (let index = 0; index < points.length; index += 1) {
        if (settle > 0.82 && cursorStrength < 0.15 && index % settledStride !== 0) continue;
        const point = points[index];
        const progress = smooth((time - point.delay) / duration);
        const arrival = 1 - progress;
        let x = point.x * w + point.scatterX * w * arrival + Math.sin(time * 1.15 + point.phase) * 1.2 * progress;
        let y = point.y * h + point.scatterY * h * arrival + Math.cos(time * 0.92 + point.phase) * 1.1 * progress;
        if (cursorStrength > 0 && cursorRadius > 0) {
          const dx = x - cursorX;
          const dy = y - cursorY;
          const distance = Math.hypot(dx, dy);
          const push = Math.max(0, 1 - distance / cursorRadius) * cursorStrength * 25;
          if (distance > 0.01 && push > 0) {
            x += (dx / distance) * push;
            y += (dy / distance) * push;
          }
        }
        const restingStrength = 1 - settle * (1 - (point.edge ? edgeRestingOpacity : restingOpacity));
        const alpha = (0.2 + transition * 0.62 + Math.sin(time * 2.2 + point.phase) * 0.11) * (0.28 + progress * 0.72) * restingStrength * opacity;
        const radius = point.size * radiusFactor * (0.62 + progress * 0.38) * (1 - settle * 0.35);
        context.globalAlpha = clamp(alpha, 0, 0.95);
        context.fillStyle = point.color;
        if (index % 7 === 0) {
          context.shadowColor = point.color;
          context.shadowBlur = 4 * progress;
        } else {
          context.shadowBlur = 0;
        }
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
      context.shadowBlur = 0;
    }

    function render(now) {
      frame = 0;
      if (destroyed || !active || !inView || !pageVisible) return;
      const delta = lastFrame ? Math.min((now - lastFrame) / 1000, 0.05) : 0;
      elapsed += delta;
      lastFrame = now;

      const idleFor = now - lastInteraction;
      const particleOpacity = 1 - smooth((idleFor - 420) / 520);
      if (particleOpacity <= 0.01) {
        active = false;
        elapsed = 0;
        avatarContext.clearRect(0, 0, width, height);
        titleContext.clearRect(0, 0, titleWidth, titleHeight);
        stage.classList.remove("hero-particle-active");
        title.classList.remove("hero-particle-active");
        stage.style.removeProperty("--avatar-particle-reveal");
        title.style.removeProperty("--title-particle-reveal");
        lastFrame = 0;
        return;
      }

      const avatarProgress = smooth(elapsed / 2.25);
      const titleProgress = smooth(elapsed / 1.55);
      stage.style.setProperty("--avatar-particle-reveal", (1 - (1 - avatarProgress) * 0.44 * particleOpacity).toFixed(3));
      title.style.setProperty("--title-particle-reveal", (1 - (1 - titleProgress) * 0.5 * particleOpacity).toFixed(3));
      const cursorStrength = pointerPower * (1 - smooth((idleFor - 35) / 420));

      avatarContext.clearRect(0, 0, width, height);
      avatarCanvas.style.transform = getComputedStyle(avatar).transform;
      avatarCanvas.style.transformOrigin = getComputedStyle(avatar).transformOrigin;
      drawPoints(avatarContext, avatarPoints, width, height, 2.25, elapsed, {
        radiusFactor: 0.92,
        restingOpacity: 0.025,
        edgeRestingOpacity: 0.16,
        settledStride: 8,
        opacity: particleOpacity,
        cursorX: pointerX,
        cursorY: pointerY,
        cursorRadius: 116,
        cursorStrength,
      });

      titleContext.clearRect(0, 0, titleWidth, titleHeight);
      drawPoints(titleContext, titlePoints, titleWidth, titleHeight, 1.55, elapsed, {
        radiusFactor: 0.86,
        restingOpacity: 0.025,
        edgeRestingOpacity: 0.045,
        settledStride: 10,
        opacity: particleOpacity,
        cursorX: titlePointerX,
        cursorY: titlePointerY,
        cursorRadius: 72,
        cursorStrength,
      });
      frame = window.requestAnimationFrame(render);
    }

    function beginFrame() {
      if (!frame && !destroyed && active && inView && pageVisible) {
        lastFrame = 0;
        frame = window.requestAnimationFrame(render);
      }
    }

    function onPointerMove(event) {
      if ((event.pointerType && event.pointerType !== "mouse") || !window.matchMedia("(pointer: fine)").matches) return;

      const stageRect = stage.getBoundingClientRect();
      const nextX = clamp(event.clientX - stageRect.left, 0, stageRect.width);
      const nextY = clamp(event.clientY - stageRect.top, 0, stageRect.height);
      if (pointerInitialized) {
        const moved = Math.hypot(nextX - pointerX, nextY - pointerY);
        pointerPower = clamp(moved / 18, 0.2, 1);
      } else {
        pointerPower = 0.7;
        pointerInitialized = true;
      }
      pointerX = nextX;
      pointerY = nextY;

      const titleRect = title.getBoundingClientRect();
      titlePointerX = clamp(event.clientX - titleRect.left, 0, titleRect.width);
      titlePointerY = clamp(event.clientY - titleRect.top, 0, titleRect.height);
      lastInteraction = performance.now();

      if (!active) {
        active = true;
        elapsed = 0;
        stage.classList.add("hero-particle-active");
        title.classList.add("hero-particle-active");
        for (const point of [...avatarPoints, ...titlePoints]) {
          point.scatterX = (Math.random() - 0.5) * 0.9;
          point.scatterY = (Math.random() - 0.5) * 0.9;
          point.delay = Math.random() * 0.28;
        }
      }
      beginFrame();
    }

    function updateVisibility() {
      pageVisible = document.visibilityState !== "hidden";
      if (active && inView && pageVisible) {
        beginFrame();
      } else if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
        lastFrame = 0;
      }
    }

    const intersection = "IntersectionObserver" in window
      ? new IntersectionObserver(([entry]) => {
          inView = entry.isIntersecting;
          updateVisibility();
        }, { rootMargin: "120px 0px" })
      : null;
    intersection?.observe(home);

    const resizeObserver = "ResizeObserver" in window ? new ResizeObserver(resize) : null;
    resizeObserver?.observe(stage);
    resizeObserver?.observe(title);
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", updateVisibility);
    home.addEventListener("pointermove", onPointerMove, { passive: true });
    resize();

    if (avatar.complete && avatar.naturalWidth) sampleAvatar();
    else avatar.addEventListener("load", sampleAvatar, { once: true });

    dispose = () => {
      destroyed = true;
      if (frame) cancelAnimationFrame(frame);
      intersection?.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", updateVisibility);
      home.removeEventListener("pointermove", onPointerMove);
      avatar.removeEventListener("load", sampleAvatar);
      avatarCanvas.remove();
      titleCanvas.remove();
      stage.classList.remove("hero-particle-active");
      title.classList.remove("hero-particle-active");
      stage.style.removeProperty("--avatar-particle-reveal");
      title.style.removeProperty("--title-particle-reveal");
    };
  }

  motionPreference.addEventListener?.("change", () => {
    dispose();
    dispose = () => {};
    mountParticleReveal();
  });
  mountParticleReveal();
}
