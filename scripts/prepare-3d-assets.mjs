import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const darkMaterials = [
  material("Obsidian metal", [0.018, 0.022, 0.035, 1], 0.95, 0.2),
  material("Cobalt chrome", [0.035, 0.12, 0.86, 1], 0.9, 0.18),
  material("Violet alloy", [0.42, 0.025, 0.78, 1], 0.84, 0.22),
];

const alienMaterials = [
  material("Alien black", [0.012, 0.006, 0.025, 1], 0.35, 0.32),
  {
    ...material("Alien purple", [0.54, 0.015, 1, 1], 0.3, 0.25),
    emissiveFactor: [0.2, 0.005, 0.48],
  },
];

function material(name, baseColorFactor, metallicFactor, roughnessFactor) {
  return {
    name,
    doubleSided: true,
    pbrMetallicRoughness: { baseColorFactor, metallicFactor, roughnessFactor },
  };
}

function externalizeBuffer(model, uri) {
  const [, encoded] = model.buffers[0].uri.split(",", 2);
  model.buffers[0].uri = uri;
  return Buffer.from(encoded, "base64");
}

function paintMeshes(model, materials, materialForMesh) {
  model.materials = materials;
  model.meshes = model.meshes.map((mesh, meshIndex) => ({
    ...mesh,
    primitives: mesh.primitives.map((primitive) => ({
      ...primitive,
      material: materialForMesh(meshIndex),
    })),
  }));
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value)}\n`);
}

const dark = JSON.parse(
  await readFile(resolve(root, "assets/models-source/dark_metal_abstract_elements.gltf"), "utf8"),
);
const darkOutput = resolve(root, "public/models/dark-metal");
const darkBuffer = externalizeBuffer(dark, "shared.bin");
paintMeshes(dark, darkMaterials, (meshIndex) => meshIndex % darkMaterials.length);
await mkdir(darkOutput, { recursive: true });
await writeFile(resolve(darkOutput, "shared.bin"), darkBuffer);

for (const [name, node] of Object.entries({ sphere: 2, cone: 5, cross: 23, orbit: 37, frame: 44 })) {
  await writeJson(resolve(darkOutput, `${name}.gltf`), {
    ...dark,
    scene: 0,
    scenes: [{ name, nodes: [node] }],
  });
}

const alien = JSON.parse(
  await readFile(resolve(root, "assets/models-source/i_os_purple_game_alien.gltf"), "utf8"),
);
const alienBuffer = externalizeBuffer(alien, "purple-alien.bin");
paintMeshes(alien, alienMaterials, (meshIndex) => (meshIndex === 0 ? 1 : 0));
alien.scene = 0;
alien.scenes = [{ name: "Purple alien", nodes: [500] }];
await writeJson(resolve(root, "public/models/purple-alien.gltf"), alien);
await writeFile(resolve(root, "public/models/purple-alien.bin"), alienBuffer);
