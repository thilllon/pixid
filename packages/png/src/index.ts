import { createIcon, type IconData, type IconOptions } from '@pixid/core';

export interface PngOptions extends IconOptions {
  /** Pixels per cell. Defaults to 4. */
  scale?: number;
}

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[n] = c >>> 0;
}

const crc32 = (bytes: Uint8Array): number => {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]!) & 0xff]! ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const adler32 = (bytes: Uint8Array): number => {
  let s1 = 1;
  let s2 = 0;
  for (let i = 0; i < bytes.length; i++) {
    s1 = (s1 + bytes[i]!) % 65521;
    s2 = (s2 + s1) % 65521;
  }
  return ((s2 << 16) | s1) >>> 0;
};

/**
 * Wraps raw bytes in a zlib stream using stored (uncompressed) deflate
 * blocks. Spec-valid everywhere, synchronous, and needs no zlib binding.
 * Icon scanlines are tiny (2 bits per pixel), so compression is not worth
 * a dependency or an async API.
 */
const zlibStore = (raw: Uint8Array): Uint8Array => {
  const blockCount = Math.max(1, Math.ceil(raw.length / 65535));
  const out = new Uint8Array(2 + raw.length + blockCount * 5 + 4);
  let pos = 0;

  out[pos++] = 0x78; // CMF: deflate, 32K window
  out[pos++] = 0x01; // FLG: no dict, fastest; (0x7801 % 31 === 0)

  for (let i = 0; i < blockCount; i++) {
    const start = i * 65535;
    const chunk = raw.subarray(start, Math.min(start + 65535, raw.length));
    const last = i === blockCount - 1;
    out[pos++] = last ? 1 : 0; // BFINAL + BTYPE=00 (stored)
    out[pos++] = chunk.length & 0xff;
    out[pos++] = chunk.length >>> 8;
    out[pos++] = ~chunk.length & 0xff;
    out[pos++] = (~chunk.length >>> 8) & 0xff;
    out.set(chunk, pos);
    pos += chunk.length;
  }

  const adler = adler32(raw);
  out[pos++] = (adler >>> 24) & 0xff;
  out[pos++] = (adler >>> 16) & 0xff;
  out[pos++] = (adler >>> 8) & 0xff;
  out[pos] = adler & 0xff;

  return out;
};

const CHUNK_TYPES = {
  IHDR: 'IHDR',
  PLTE: 'PLTE',
  IDAT: 'IDAT',
  IEND: 'IEND',
} as const;

const chunk = (type: string, data: Uint8Array): Uint8Array => {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) {
    out[4 + i] = type.charCodeAt(i);
  }
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
};

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/**
 * Encodes precomputed icon data as a PNG file.
 *
 * Uses an indexed-color PNG (3-entry palette, 2 bits per pixel), so files
 * stay small without a compression library.
 */
export const iconToPng = (icon: IconData, scale = 4): Uint8Array => {
  if (!Number.isInteger(scale) || scale < 1) {
    throw new RangeError(`invalid scale: ${scale} (expected a positive integer)`);
  }

  const px = icon.size * scale;
  const bytesPerRow = Math.ceil(px / 4); // 2 bits per pixel
  const raw = new Uint8Array((1 + bytesPerRow) * px);

  for (let y = 0; y < px; y++) {
    const rowStart = y * (1 + bytesPerRow) + 1; // +1 skips the filter byte (0 = None)
    const gridRow = Math.floor(y / scale) * icon.size;
    for (let x = 0; x < px; x++) {
      const value = icon.grid[gridRow + Math.floor(x / scale)]!;
      // Pack 4 pixels per byte, leftmost pixel in the highest bits.
      const byteIndex = rowStart + (x >> 2);
      raw[byteIndex] = raw[byteIndex]! | (value << ((3 - (x & 3)) * 2));
    }
  }

  const ihdr = new Uint8Array(13);
  const ihdrView = new DataView(ihdr.buffer);
  ihdrView.setUint32(0, px);
  ihdrView.setUint32(4, px);
  ihdr[8] = 2; // bit depth
  ihdr[9] = 3; // color type: indexed
  ihdr[10] = 0; // compression: deflate
  ihdr[11] = 0; // filter method
  ihdr[12] = 0; // no interlace

  const palette = new Uint8Array([...icon.bgcolor, ...icon.color, ...icon.spotcolor]);

  const chunks = [
    new Uint8Array(PNG_SIGNATURE),
    chunk(CHUNK_TYPES.IHDR, ihdr),
    chunk(CHUNK_TYPES.PLTE, palette),
    chunk(CHUNK_TYPES.IDAT, zlibStore(raw)),
    chunk(CHUNK_TYPES.IEND, new Uint8Array(0)),
  ];

  const out = new Uint8Array(chunks.reduce((sum, c) => sum + c.length, 0));
  let pos = 0;
  for (const c of chunks) {
    out.set(c, pos);
    pos += c.length;
  }
  return out;
};

/** Generates an icon and encodes it as a PNG file. */
export const toPng = (options: PngOptions = {}): Uint8Array =>
  iconToPng(createIcon(options), options.scale ?? 4);

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const toBase64 = (bytes: Uint8Array): string => {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i]!;
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    out += BASE64_CHARS[b0 >> 2]!;
    out += BASE64_CHARS[((b0 & 3) << 4) | ((b1 ?? 0) >> 4)]!;
    out += b1 === undefined ? '=' : BASE64_CHARS[((b1 & 15) << 2) | ((b2 ?? 0) >> 6)]!;
    out += b2 === undefined ? '=' : BASE64_CHARS[b2 & 63]!;
  }
  return out;
};

/** Generates an icon and encodes it as a `data:image/png;base64` URL. */
export const toPngDataURL = (options: PngOptions = {}): string =>
  `data:image/png;base64,${toBase64(toPng(options))}`;
