import {
  SOURCE_IMAGE_MAX_BYTES,
  SOURCE_IMAGE_MAX_PIXELS,
  SOURCE_IMAGE_MAX_SIDE,
  SUBMISSION_IMAGE_MAX_BYTES,
  SUBMISSION_IMAGE_MAX_PIXELS,
  SUBMISSION_IMAGE_MAX_SIDE,
  fitImageDimensions,
  imageFitsWithin,
  type ImageDimensions,
  type SubmissionImageType,
} from "@/supabase/functions/_shared/image-policy";
import {
  identifyImage,
  readImageDimensions,
} from "@/supabase/functions/_shared/image";

const WEBP_QUALITIES = [0.86, 0.78, 0.7, 0.62];
const MAX_RESIZE_PASSES = 3;

export type PreparedSubmissionImage = {
  file: File;
  optimized: boolean;
  originalDimensions: ImageDimensions;
  dimensions: ImageDimensions;
};

type Drawable = CanvasImageSource & { width: number; height: number };
type CanvasTarget = {
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  encode: (quality: number) => Promise<Blob>;
  release: () => void;
};

export function submissionImageFingerprint(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}:${file.type}`;
}

async function inspectImage(file: File) {
  if (file.size > SOURCE_IMAGE_MAX_BYTES)
    throw new Error(`A imagem "${file.name}" deve ter até 25 MB antes da otimização.`);
  let bytes: Uint8Array | undefined = new Uint8Array(await file.arrayBuffer());
  try {
    const type = identifyImage(bytes, SOURCE_IMAGE_MAX_BYTES);
    if (file.type && file.type !== type)
      throw new Error(`O conteúdo da imagem "${file.name}" não corresponde ao formato informado.`);
    const dimensions = readImageDimensions(bytes, SOURCE_IMAGE_MAX_BYTES);
    if (!imageFitsWithin(dimensions, SOURCE_IMAGE_MAX_PIXELS, SOURCE_IMAGE_MAX_SIDE))
      throw new Error(`A imagem "${file.name}" excede o limite de origem de 64 megapixels.`);
    return { type, dimensions };
  } finally {
    bytes = undefined;
  }
}

async function decodeImage(file: File, target: ImageDimensions) {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
      resizeWidth: target.width,
      resizeHeight: target.height,
      resizeQuality: "high",
    });
    return {
      drawable: bitmap as Drawable,
      release: () => bitmap.close(),
    };
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = objectUrl;
    await image.decode();
    return { drawable: image as Drawable, release: () => undefined };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function createCanvas(dimensions: ImageDimensions): CanvasTarget {
  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(dimensions.width, dimensions.height);
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) throw new Error("O navegador não conseguiu preparar a imagem.");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    return {
      context,
      encode: (quality) => canvas.convertToBlob({ type: "image/webp", quality }),
      release: () => {
        canvas.width = 1;
        canvas.height = 1;
      },
    };
  }

  const canvas = document.createElement("canvas");
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) throw new Error("O navegador não conseguiu preparar a imagem.");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  return {
    context,
    encode: (quality) => new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error("O navegador não conseguiu comprimir a imagem.")),
        "image/webp",
        quality,
      );
    }),
    release: () => {
      canvas.width = 1;
      canvas.height = 1;
    },
  };
}

async function encodeWithinLimit(drawable: Drawable, initialDimensions: ImageDimensions) {
  let dimensions = fitImageDimensions(initialDimensions);
  let lastBlob: Blob | undefined;

  for (let pass = 0; pass < MAX_RESIZE_PASSES; pass++) {
    const canvas = createCanvas(dimensions);
    try {
      canvas.context.drawImage(drawable, 0, 0, dimensions.width, dimensions.height);
      for (const quality of WEBP_QUALITIES) {
        const blob = await canvas.encode(quality);
        if (blob.type !== "image/webp")
          throw new Error("Este navegador não oferece a compressão WebP necessária.");
        lastBlob = blob;
        if (blob.size <= SUBMISSION_IMAGE_MAX_BYTES) return { blob, dimensions };
      }
    } finally {
      canvas.release();
    }

    const shrink = Math.min(
      0.9,
      Math.sqrt(SUBMISSION_IMAGE_MAX_BYTES / Math.max(lastBlob?.size || 1, 1)) * 0.92,
    );
    dimensions = {
      width: Math.max(1, Math.floor(dimensions.width * shrink)),
      height: Math.max(1, Math.floor(dimensions.height * shrink)),
    };
  }
  throw new Error("Não foi possível reduzir a imagem para menos de 5 MB.");
}

export async function prepareSubmissionImage(file: File): Promise<PreparedSubmissionImage> {
  const inspected = await inspectImage(file);
  const needsResize = !imageFitsWithin(
    inspected.dimensions,
    SUBMISSION_IMAGE_MAX_PIXELS,
    SUBMISSION_IMAGE_MAX_SIDE,
  );
  if (!needsResize && file.size <= SUBMISSION_IMAGE_MAX_BYTES) {
    const normalized = file.type === inspected.type
      ? file
      : new File([file], file.name, { type: inspected.type, lastModified: file.lastModified });
    return {
      file: normalized,
      optimized: false,
      originalDimensions: inspected.dimensions,
      dimensions: inspected.dimensions,
    };
  }

  const target = fitImageDimensions(inspected.dimensions);
  let decoded: Awaited<ReturnType<typeof decodeImage>> | undefined;
  try {
    decoded = await decodeImage(file, target);
    const encoded = await encodeWithinLimit(decoded.drawable, {
      width: decoded.drawable.width,
      height: decoded.drawable.height,
    });
    const basename = file.name.replace(/\.[^.]+$/, "") || "imagem";
    return {
      file: new File([encoded.blob], `${basename}.webp`, {
        type: "image/webp" satisfies SubmissionImageType,
        lastModified: file.lastModified,
      }),
      optimized: true,
      originalDimensions: inspected.dimensions,
      dimensions: encoded.dimensions,
    };
  } catch (error) {
    if (error instanceof Error && /imagem|navegador|WebP/.test(error.message)) throw error;
    throw new Error(`Não foi possível otimizar a imagem "${file.name}" neste dispositivo.`);
  } finally {
    decoded?.release();
  }
}
