import {
  SOURCE_IMAGE_MAX_BYTES,
  SOURCE_IMAGE_MAX_PIXELS,
  SOURCE_IMAGE_MAX_SIDE,
  SUBMISSION_IMAGE_MAX_BYTES,
  SUBMISSION_IMAGE_MAX_PIXELS,
  SUBMISSION_IMAGE_MAX_SIDE,
  type ImageDimensions,
  imageFitsWithin,
} from "./image-policy.ts";

const jpegSizeMarkers = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);
const validDimensions = (width: number, height: number): ImageDimensions => {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1)
    throw new Error("Não foi possível ler as dimensões da imagem.");
  return { width, height };
};
const uint24le = (bytes: Uint8Array, offset: number) => bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
const uint32le = (bytes: Uint8Array, offset: number) => new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(offset, true);

export function identifyImage(bytes: Uint8Array, maxBytes = SUBMISSION_IMAGE_MAX_BYTES) {
  if (bytes.length < 12 || bytes.length > maxBytes) {
    const maxMegabytes = Math.round(maxBytes / (1024 * 1024));
    throw new Error(`A imagem deve ter até ${maxMegabytes} MB.`);
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg" as const;
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)) return "image/png" as const;
  if ([82, 73, 70, 70].every((value, index) => bytes[index] === value)
    && [87, 69, 66, 80].every((value, index) => bytes[index + 8] === value)) return "image/webp" as const;
  throw new Error("Use uma imagem JPEG, PNG ou WebP válida.");
}

export function readImageDimensions(
  bytes: Uint8Array,
  maxBytes = SUBMISSION_IMAGE_MAX_BYTES,
): ImageDimensions {
  const mime = identifyImage(bytes, maxBytes);
  if (mime === "image/png") {
    if (bytes.length < 33
      || new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(8) !== 13
      || String.fromCharCode(...bytes.slice(12, 16)) !== "IHDR")
      throw new Error("PNG sem cabeçalho de dimensões válido.");
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return validDimensions(view.getUint32(16), view.getUint32(20));
  }
  if (mime === "image/jpeg") {
    let cursor = 2;
    while (cursor < bytes.length) {
      if (bytes[cursor] !== 0xff) throw new Error("JPEG com estrutura inválida.");
      while (cursor < bytes.length && bytes[cursor] === 0xff) cursor++;
      if (cursor >= bytes.length) break;
      const marker = bytes[cursor++];
      if (marker === 0x00) throw new Error("JPEG com marcador inválido.");
      if (marker === 0xd9 || marker === 0xda) break;
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (cursor + 1 >= bytes.length) break;
      const length = (bytes[cursor] << 8) | bytes[cursor + 1];
      if (length < 2 || cursor + length > bytes.length) break;
      if (jpegSizeMarkers.has(marker)) {
        if (length < 8) throw new Error("JPEG com segmento de dimensões inválido.");
        const components = bytes[cursor + 7];
        if (components < 1 || length !== 8 + 3 * components)
          throw new Error("JPEG com segmento de dimensões inválido.");
        return validDimensions(
          (bytes[cursor + 5] << 8) | bytes[cursor + 6],
          (bytes[cursor + 3] << 8) | bytes[cursor + 4],
        );
      }
      cursor += length;
    }
    throw new Error("JPEG sem cabeçalho de dimensões válido.");
  }

  if (bytes.length !== uint32le(bytes, 4) + 8) throw new Error("WebP com tamanho RIFF inválido.");
  let cursor = 12;
  let canvasDimensions: ImageDimensions | undefined;
  let imageDimensions: ImageDimensions | undefined;
  while (cursor < bytes.length) {
    if (cursor + 8 > bytes.length) throw new Error("WebP com cabeçalho de bloco truncado.");
    const chunk = String.fromCharCode(...bytes.slice(cursor, cursor + 4));
    const size = uint32le(bytes, cursor + 4);
    const data = cursor + 8;
    const dataEnd = data + size;
    const next = dataEnd + (size % 2);
    if (dataEnd > bytes.length || next > bytes.length) throw new Error("WebP com bloco truncado.");
    if (chunk === "ANIM" || chunk === "ANMF") throw new Error("WebP animado não é permitido.");
    if (chunk === "VP8X") {
      if (size !== 10 || bytes[data + 1] !== 0 || bytes[data + 2] !== 0 || bytes[data + 3] !== 0)
        throw new Error("WebP com cabeçalho estendido inválido.");
      if ((bytes[data] & 0x02) !== 0) throw new Error("WebP animado não é permitido.");
      if (canvasDimensions) throw new Error("WebP com múltiplos cabeçalhos estendidos.");
      canvasDimensions = validDimensions(uint24le(bytes, data + 4) + 1, uint24le(bytes, data + 7) + 1);
    }
    if (chunk === "VP8L" && size >= 5 && data + 5 <= bytes.length && bytes[data] === 0x2f) {
      if ((bytes[data + 4] >> 5) !== 0) throw new Error("WebP lossless com versão inválida.");
      const width = 1 + bytes[data + 1] + ((bytes[data + 2] & 0x3f) << 8);
      const height = 1 + ((bytes[data + 2] & 0xc0) >> 6) + (bytes[data + 3] << 2) + ((bytes[data + 4] & 0x0f) << 10);
      if (imageDimensions) throw new Error("WebP com múltiplos blocos de imagem.");
      imageDimensions = validDimensions(width, height);
    }
    if (chunk === "VP8 " && size >= 10 && data + 10 <= bytes.length
      && bytes[data + 3] === 0x9d && bytes[data + 4] === 0x01 && bytes[data + 5] === 0x2a) {
      if ((bytes[data] & 1) !== 0) throw new Error("WebP lossy sem quadro-chave válido.");
      if (imageDimensions) throw new Error("WebP com múltiplos blocos de imagem.");
      imageDimensions = validDimensions(
        (bytes[data + 6] | (bytes[data + 7] << 8)) & 0x3fff,
        (bytes[data + 8] | (bytes[data + 9] << 8)) & 0x3fff,
      );
    }
    cursor = next;
  }
  if (canvasDimensions && imageDimensions
    && (canvasDimensions.width !== imageDimensions.width || canvasDimensions.height !== imageDimensions.height))
    throw new Error("WebP com dimensões inconsistentes.");
  if (canvasDimensions || imageDimensions) return (canvasDimensions || imageDimensions)!;
  throw new Error("WebP sem cabeçalho de dimensões válido.");
}

export function assertImageDimensions(
  bytes: Uint8Array,
  maxPixels = SUBMISSION_IMAGE_MAX_PIXELS,
  maxSide = SUBMISSION_IMAGE_MAX_SIDE,
  maxBytes = SUBMISSION_IMAGE_MAX_BYTES,
): ImageDimensions {
  const dimensions = readImageDimensions(bytes, maxBytes);
  if (dimensions.width > maxSide || dimensions.height > maxSide)
    throw new Error("A imagem excede o limite de dimensões.");
  if (!imageFitsWithin(dimensions, maxPixels, maxSide))
    throw new Error(`A imagem excede ${Math.round(maxPixels / 1_000_000)} megapixels.`);
  return dimensions;
}

export function assertSourceImageDimensions(bytes: Uint8Array): ImageDimensions {
  return assertImageDimensions(
    bytes,
    SOURCE_IMAGE_MAX_PIXELS,
    SOURCE_IMAGE_MAX_SIDE,
    SOURCE_IMAGE_MAX_BYTES,
  );
}
