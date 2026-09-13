"use client";

import { createElement, useEffect, useRef, useState } from "react";
import {
  getModelSceneUrl,
  MODEL_VIEWER_SRC,
  type ModelScene,
} from "@/lib/model-scenes";

type ModelArtifactProps = {
  scene: ModelScene;
  label: string;
  className?: string;
};

let viewerPromise: Promise<void> | null = null;

function loadViewer() {
  if (customElements.get("model-viewer")) return Promise.resolve();
  if (viewerPromise) return viewerPromise;

  viewerPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.type = "module";
    script.src = MODEL_VIEWER_SRC;
    script.crossOrigin = "anonymous";
    script.referrerPolicy = "strict-origin-when-cross-origin";
    script.onload = () => customElements.whenDefined("model-viewer").then(() => resolve());
    script.onerror = () => {
      script.remove();
      viewerPromise = null;
      reject(new Error("Não foi possível carregar o visualizador 3D."));
    };
    document.head.appendChild(script);
  });

  return viewerPromise;
}

export function ModelArtifact({ scene, label, className = "" }: ModelArtifactProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [viewerReady, setViewerReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const load = () => {
      setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      loadViewer().then(() => setViewerReady(true), () => setFailed(true));
    };
    if (!("IntersectionObserver" in window)) {
      load();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        load();
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  return (
    <figure ref={rootRef} className={`model-artifact ${className}`.trim()}>
      {failed ? (
        <p className="model-artifact__status" role="status">Objeto 3D temporariamente indisponível.</p>
      ) : viewerReady ? (
        createElement(
          "model-viewer",
          {
            src: getModelSceneUrl(scene),
            alt: label,
            onError: () => setFailed(true),
            autoplay: !reduceMotion,
            "auto-rotate": !reduceMotion,
            "camera-controls": true,
            "disable-pan": true,
            "disable-zoom": true,
            "interaction-prompt": "none",
            loading: "lazy",
            "touch-action": "pan-y",
          },
          <span className="model-artifact__status" slot="poster">Carregando objeto 3D…</span>,
        )
      ) : (
        <p className="model-artifact__status" aria-live="polite">Carregando objeto 3D…</p>
      )}
    </figure>
  );
}
