---
type: "query"
date: "2026-09-13T13:53:01.420267+00:00"
question: "Como os modelos 3D, paginas e estilos se relacionam no projeto?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["MODEL_SCENES", "ModelArtifact", "Home"]
---

# Q: Como os modelos 3D, paginas e estilos se relacionam no projeto?

## Answer

Expanded from original query via vocab: model, scene, artifact, viewer, page, style, home. MODEL_SCENES centralizes every asset URL; getModelSceneUrl feeds ModelArtifact; Home and Sobre import ModelArtifact; the integration test imports the same catalog. This is the smallest reliable boundary for keeping the model map current.

## Outcome

- Signal: useful

## Source Nodes

- MODEL_SCENES
- ModelArtifact
- Home