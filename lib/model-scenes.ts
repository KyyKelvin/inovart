export const MODEL_VIEWER_SRC =
  "https://ajax.googleapis.com/ajax/libs/model-viewer/4.3.1/model-viewer.min.js";

export const MODEL_SCENES = {
  metalSphere: "/models/dark-metal/sphere.gltf",
  metalCone: "/models/dark-metal/cone.gltf",
  metalCross: "/models/dark-metal/cross.gltf",
  metalOrbit: "/models/dark-metal/orbit.gltf",
  metalFrame: "/models/dark-metal/frame.gltf",
  alien: "/models/purple-alien.gltf",
} as const;

export type ModelScene = keyof typeof MODEL_SCENES;

export function getModelSceneUrl(scene: ModelScene) {
  return MODEL_SCENES[scene];
}
