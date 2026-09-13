import test from "node:test";
import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  MODEL_SCENES,
  MODEL_VIEWER_SRC,
  getModelSceneUrl,
} from "../lib/model-scenes.ts";

test("uses the local GLTF objects with the pinned model viewer", async () => {
  assert.equal(
    MODEL_VIEWER_SRC,
    "https://ajax.googleapis.com/ajax/libs/model-viewer/4.3.1/model-viewer.min.js",
  );
  assert.deepEqual(Object.keys(MODEL_SCENES), ["orbita", "alien"]);
  assert.equal(getModelSceneUrl("orbita"), "/models/dark_metal_abstract_elements.gltf");
  assert.equal(getModelSceneUrl("alien"), "/models/i_os_purple_game_alien.gltf");

  for (const modelUrl of Object.values(MODEL_SCENES)) {
    await access(fileURLToPath(new URL(`../public${modelUrl}`, import.meta.url)));
  }
});
