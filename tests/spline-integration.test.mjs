import test from "node:test";
import assert from "node:assert/strict";
import {
  SPLINE_SCENES,
  SPLINE_VIEWER_SRC,
  getSplineSceneUrl,
} from "../lib/spline-scenes.ts";

test("pins the official Spline viewer and keeps scene URLs allowlisted", () => {
  assert.equal(
    SPLINE_VIEWER_SRC,
    "https://cdn.spline.design/@splinetool/viewer@2.0.46/build/spline-viewer.js",
  );
  assert.deepEqual(Object.keys(SPLINE_SCENES), ["orbita", "materia"]);
  assert.equal(
    getSplineSceneUrl("orbita"),
    "https://prod.spline.design/EAYLyKD1JZZXOr5D/scene.splinecode",
  );
  assert.equal(
    getSplineSceneUrl("materia"),
    "https://prod.spline.design/rYvgqSWCQA2pVKHZ/scene.splinecode",
  );
});
