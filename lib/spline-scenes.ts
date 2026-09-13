export const SPLINE_VIEWER_SRC =
  "https://cdn.spline.design/@splinetool/viewer@2.0.46/build/spline-viewer.js";

export const SPLINE_SCENES = {
  orbita: "https://prod.spline.design/EAYLyKD1JZZXOr5D/scene.splinecode",
  materia: "https://prod.spline.design/rYvgqSWCQA2pVKHZ/scene.splinecode",
} as const;

export type SplineScene = keyof typeof SPLINE_SCENES;

export function getSplineSceneUrl(scene: SplineScene) {
  return SPLINE_SCENES[scene];
}
