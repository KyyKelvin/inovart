export const MODEL_VIEWER_SRC =
  "https://ajax.googleapis.com/ajax/libs/model-viewer/4.3.1/model-viewer.min.js";

export const MODEL_SCENES = {
  orbita: "/models/dark_metal_abstract_elements.gltf",
  alien: "/models/i_os_purple_game_alien.gltf",
} as const;

export type ModelScene = keyof typeof MODEL_SCENES;

export function getModelSceneUrl(scene: ModelScene) {
  return MODEL_SCENES[scene];
}
