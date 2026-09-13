"use client";

import { createElement, useEffect, useId, useRef, useState } from "react";
import {
  getSplineSceneUrl,
  SPLINE_VIEWER_SRC,
  type SplineScene,
} from "@/lib/spline-scenes";

type ViewerStatus = "idle" | "loading" | "ready" | "error";

type SplineArtifactProps = {
  scene: SplineScene;
  label: string;
  className?: string;
};

let viewerScriptPromise: Promise<void> | null = null;

function loadSplineViewer() {
  if (customElements.get("spline-viewer")) return Promise.resolve();
  if (viewerScriptPromise) return viewerScriptPromise;

  viewerScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-inovart-spline-viewer]",
    );
    const script = existing ?? document.createElement("script");
    let timeoutId = 0;

    const cleanUp = () => {
      window.clearTimeout(timeoutId);
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
    };
    const handleError = () => {
      cleanUp();
      script.remove();
      reject(new Error("Não foi possível carregar o visualizador 3D."));
    };
    const handleLoad = () => {
      script.dataset.state = "loaded";
      customElements.whenDefined("spline-viewer").then(() => {
        cleanUp();
        resolve();
      });
    };

    timeoutId = window.setTimeout(handleError, 20_000);
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });

    if (existing?.dataset.state === "loaded") {
      handleLoad();
      return;
    }

    if (!existing) {
      script.type = "module";
      script.src = SPLINE_VIEWER_SRC;
      script.crossOrigin = "anonymous";
      script.referrerPolicy = "strict-origin-when-cross-origin";
      script.dataset.inovartSplineViewer = "2.0.46";
      document.head.appendChild(script);
    }
  }).catch((error: unknown) => {
    viewerScriptPromise = null;
    throw error;
  });

  return viewerScriptPromise;
}

export function SplineArtifact({ scene, label, className = "" }: SplineArtifactProps) {
  const figureRef = useRef<HTMLElement>(null);
  const captionId = useId();
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [status, setStatus] = useState<ViewerStatus>("idle");

  useEffect(() => {
    const figure = figureRef.current;
    if (!figure) return;

    if (!("IntersectionObserver" in window)) {
      setIsNearViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setIsNearViewport(true);
        observer.disconnect();
      },
      { rootMargin: "400px 0px" },
    );

    observer.observe(figure);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isNearViewport) return;
    let active = true;
    setStatus("loading");

    loadSplineViewer().then(
      () => active && setStatus("ready"),
      () => active && setStatus("error"),
    );

    return () => {
      active = false;
    };
  }, [isNearViewport]);

  return (
    <figure
      ref={figureRef}
      className={`spline-artifact ${className}`.trim()}
      aria-labelledby={captionId}
    >
      <div className="spline-artifact__stage">
        {status === "ready"
          ? createElement("spline-viewer", {
              url: getSplineSceneUrl(scene),
              "aria-hidden": "true",
            })
          : (
              <div className="spline-artifact__fallback" aria-live="polite">
                <span aria-hidden="true">◎</span>
                <p>
                  {status === "error"
                    ? "Objeto 3D temporariamente indisponível."
                    : "Carregando objeto 3D…"}
                </p>
              </div>
            )}
        <span className="spline-artifact__cross spline-artifact__cross--a" aria-hidden="true">+</span>
        <span className="spline-artifact__cross spline-artifact__cross--b" aria-hidden="true">+</span>
      </div>
      <figcaption id={captionId}>
        <span>OBJETO_3D</span>
        {label}
      </figcaption>
    </figure>
  );
}
