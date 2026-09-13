import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
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
  assert.deepEqual(Object.keys(MODEL_SCENES), [
    "metalSphere",
    "metalCone",
    "metalCross",
    "metalOrbit",
    "metalFrame",
    "alien",
  ]);
  assert.equal(getModelSceneUrl("metalSphere"), "/models/dark-metal/sphere.gltf");
  assert.equal(getModelSceneUrl("alien"), "/models/purple-alien.gltf");

  for (const modelUrl of Object.values(MODEL_SCENES)) {
    await access(fileURLToPath(new URL(`../public${modelUrl}`, import.meta.url)));
  }
});

test("preserves colored materials and isolated dark-metal roots", async () => {
  const darkScenes = Object.entries(MODEL_SCENES).filter(([name]) => name.startsWith("metal"));

  for (const [, modelUrl] of darkScenes) {
    const source = await readFile(
      fileURLToPath(new URL(`../public${modelUrl}`, import.meta.url)),
      "utf8",
    );
    const model = JSON.parse(source);
    assert.equal(model.scenes[0].nodes.length, 1);
    assert.ok(model.materials.length >= 3);
    assert.equal(model.buffers[0].uri, "shared.bin");
  }

  const alien = JSON.parse(
    await readFile(
      fileURLToPath(new URL("../public/models/purple-alien.gltf", import.meta.url)),
      "utf8",
    ),
  );
  assert.equal(alien.materials[1].name, "Alien purple");
  assert.ok(alien.materials[1].pbrMetallicRoughness.baseColorFactor[2] > 0.8);
});

test("renders each 3D object without an editorial panel", async () => {
  const component = await readFile(
    fileURLToPath(new URL("../components/model-artifact.tsx", import.meta.url)),
    "utf8",
  );
  const home = await readFile(
    fileURLToPath(new URL("../app/page.tsx", import.meta.url)),
    "utf8",
  );
  const about = await readFile(
    fileURLToPath(new URL("../app/sobre/page.tsx", import.meta.url)),
    "utf8",
  );

  assert.doesNotMatch(component, /model-artifact__stage/);
  assert.doesNotMatch(component, /<figcaption/);
  assert.doesNotMatch(component, /OBJETO_3D/);
  assert.match(component, /"auto-rotate": !reduceMotion/);
  assert.match(component, /"disable-zoom": true/);
  assert.doesNotMatch(home, /model-scatter/);
  assert.equal(home.match(/className="model-ornament/g)?.length, 6);
  for (const scene of Object.keys(MODEL_SCENES).filter((name) => name.startsWith("metal"))) {
    assert.match(home, new RegExp(`scene="${scene}"`));
  }
  assert.match(home, /scene="alien"/);
  assert.doesNotMatch(about, /scene="alien"/);
  assert.doesNotMatch(about, /ModelArtifact/);
});
