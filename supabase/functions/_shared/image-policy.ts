export const SUBMISSION_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type SubmissionImageType = (typeof SUBMISSION_IMAGE_TYPES)[number];

export const SUBMISSION_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const SUBMISSION_IMAGES_MAX_BYTES = 35 * 1024 * 1024;
export const SUBMISSION_IMAGE_MAX_PIXELS = 16_000_000;
export const SUBMISSION_IMAGE_MAX_SIDE = 16_384;
export const SUBMISSION_IMAGE_OUTPUT_MAX_SIDE = 1_800;

// Originals are inspected locally and never uploaded at these limits. The cap
// protects low-memory devices while covering common 48/50 MP phone cameras.
export const SOURCE_IMAGE_MAX_BYTES = 25 * 1024 * 1024;
export const SOURCE_IMAGE_MAX_PIXELS = 64_000_000;
export const SOURCE_IMAGE_MAX_SIDE = 32_768;

export type ImageDimensions = { width: number; height: number };

export function imageFitsWithin(
  dimensions: ImageDimensions,
  maxPixels = SUBMISSION_IMAGE_MAX_PIXELS,
  maxSide = SUBMISSION_IMAGE_MAX_SIDE,
) {
  return dimensions.width <= maxSide
    && dimensions.height <= maxSide
    && dimensions.width <= Math.floor(maxPixels / dimensions.height);
}

export function fitImageDimensions(
  dimensions: ImageDimensions,
  maxPixels = SUBMISSION_IMAGE_MAX_PIXELS,
  maxSide = SUBMISSION_IMAGE_MAX_SIDE,
): ImageDimensions {
  const pixelScale = imageFitsWithin(dimensions, maxPixels, Number.MAX_SAFE_INTEGER)
    ? 1
    : Math.sqrt(maxPixels / (dimensions.width * dimensions.height));
  const sideScale = Math.min(1, maxSide / Math.max(dimensions.width, dimensions.height));
  const scale = Math.min(1, pixelScale, sideScale);
  let width = Math.max(1, Math.floor(dimensions.width * scale));
  let height = Math.max(1, Math.floor(dimensions.height * scale));

  // Guard against floating-point rounding putting the result one row over.
  while (width > Math.floor(maxPixels / height)) {
    if (width >= height) width--;
    else height--;
  }
  return { width, height };
}
