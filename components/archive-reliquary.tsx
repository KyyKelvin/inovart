"use client";

import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";

type Particle = {
  x: number;
  y: number;
  z: number;
  size: number;
  tone: 0 | 1 | 2;
};

function createParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, index) => ({
    x: Math.sin(index * 12.9898) * 1.2,
    y: Math.cos(index * 4.1414) * 0.9,
    z: ((index * 47) % count) / count,
    size: 0.7 + (index % 5) * 0.24,
    tone: (index % 3) as Particle["tone"],
  }));
}

export function ArchiveReliquary() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarsePointer = window.matchMedia("(pointer: coarse)");
    const particles = createParticles(coarsePointer.matches ? 36 : 150);
    const tones = ["#2347ff", "#55f58a", "#f0f0ea"] as const;
    let frame = 0;
    let visible = true;
    let width = 1;
    let height = 1;
    let last = 0;

    const resize = () => {
      const bounds = root.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (now = 0) => {
      context.clearRect(0, 0, width, height);
      const motionTime = reduceMotion.matches ? 0 : now * 0.00008;
      const pointer = pointerRef.current;

      for (const particle of particles) {
        const depth = (particle.z + motionTime) % 1;
        const scale = 0.28 + depth * 1.35;
        const driftX = Math.sin(now * 0.00022 + particle.y * 4) * 8;
        const px = width / 2 + (particle.x * width * 0.45 + driftX + pointer.x * 20) * scale;
        const py = height / 2 + (particle.y * height * 0.42 + pointer.y * 14) * scale;
        const alpha = 0.08 + depth * 0.48;
        context.beginPath();
        context.fillStyle = `${tones[particle.tone]}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`;
        context.arc(px, py, particle.size * scale, 0, Math.PI * 2);
        context.fill();
      }
    };

    const tick = (now: number) => {
      if (visible && document.visibilityState === "visible") {
        if (now - last > 32) {
          draw(now);
          last = now;
        }
        frame = window.requestAnimationFrame(tick);
      }
    };

    const start = () => {
      window.cancelAnimationFrame(frame);
      if (reduceMotion.matches) {
        draw(0);
      } else if (visible && document.visibilityState === "visible") {
        frame = window.requestAnimationFrame(tick);
      }
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      start();
    }, { threshold: 0.05 });
    const resizer = new ResizeObserver(() => {
      resize();
      draw(0);
    });
    const handleVisibility = () => start();

    resize();
    draw(0);
    observer.observe(root);
    resizer.observe(root);
    reduceMotion.addEventListener("change", start);
    document.addEventListener("visibilitychange", handleVisibility);
    start();

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      resizer.disconnect();
      reduceMotion.removeEventListener("change", start);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    const root = rootRef.current;
    if (!root) return;
    const bounds = root.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    pointerRef.current = { x, y };
    root.style.setProperty("--relic-x", `${x * 12}deg`);
    root.style.setProperty("--relic-y", `${y * -10}deg`);
  };

  const resetPointer = () => {
    pointerRef.current = { x: 0, y: 0 };
    rootRef.current?.style.setProperty("--relic-x", "0deg");
    rootRef.current?.style.setProperty("--relic-y", "0deg");
  };

  return (
    <div
      ref={rootRef}
      className="archive-reliquary"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="reliquary-particles" />
      <div className="reliquary-stage">
        <div className="reliquary-plane relic-grid" />
        <div className="reliquary-plane relic-orbit"><i /><i /><i /></div>
        <div className="reliquary-plane relic-object">
          <span className="relic-cut relic-cut-a" />
          <span className="relic-cut relic-cut-b" />
          <span className="relic-cut relic-cut-c" />
        </div>
        <div className="reliquary-plane relic-title">INOV<br /><em>ART</em></div>
        <div className="reliquary-plane relic-label">OBJETO / ARQUIVO<br />VGA—021</div>
      </div>
      <span className="reliquary-hint">mova o cursor // explore a matéria</span>
    </div>
  );
}
