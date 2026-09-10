import { createIcon } from '@pixid/core';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import { iconToPng, toPng, toPngDataURL } from './index.js';

/**
 * pngjs acts as an independent decoder oracle: if it can parse our output,
 * the signature, chunk layout, CRCs, zlib stream, and bit packing are all
 * spec-conformant.
 */
const decode = (bytes: Uint8Array) => PNG.sync.read(Buffer.from(bytes));

const expectPixelsMatchGrid = (seed: string, size: number, scale: number) => {
  const icon = createIcon({ seed, size });
  const png = decode(toPng({ seed, size, scale }));
  const px = size * scale;

  expect(png.width).toBe(px);
  expect(png.height).toBe(px);

  // Build the full expected RGBA buffer and compare in one pass; a per-pixel
  // expect() would be prohibitively slow for the larger images.
  const palette = [icon.bgcolor, icon.color, icon.spotcolor];
  const expected = new Uint8Array(px * px * 4);
  for (let y = 0; y < px; y++) {
    for (let x = 0; x < px; x++) {
      const cell = icon.grid[Math.floor(y / scale) * size + Math.floor(x / scale)]!;
      const [r, g, b] = palette[cell]!;
      const o = (y * px + x) * 4;
      expected[o] = r;
      expected[o + 1] = g;
      expected[o + 2] = b;
      expected[o + 3] = 255;
    }
  }

  const actual = new Uint8Array(png.data.buffer, png.data.byteOffset, png.data.length);
  let firstMismatch = -1;
  for (let i = 0; i < expected.length; i++) {
    if (actual[i] !== expected[i]) {
      firstMismatch = i;
      break;
    }
  }
  if (firstMismatch !== -1) {
    const p = Math.floor(firstMismatch / 4);
    expect.fail(
      `pixel (${p % px},${Math.floor(p / px)}) byte ${firstMismatch % 4}: ` +
        `expected ${expected[firstMismatch]}, got ${actual[firstMismatch]}`,
    );
  }
  expect(actual.length).toBe(expected.length);
};

describe('toPng', () => {
  it('starts with the PNG signature', () => {
    const bytes = toPng({ seed: 'signature' });
    expect([...bytes.slice(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  });

  it('is deterministic for the same options', () => {
    expect(toPng({ seed: 'stable', scale: 7 })).toEqual(toPng({ seed: 'stable', scale: 7 }));
  });

  it('decodes to exactly the upscaled core grid (default options)', () => {
    expectPixelsMatchGrid('pixel-perfect', 8, 4);
  });

  it('decodes correctly when the pixel width is not byte-aligned', () => {
    // 5 * 3 = 15px rows: 2-bit packing must handle partial trailing bytes.
    expectPixelsMatchGrid('odd-width', 5, 3);
    expectPixelsMatchGrid('odd-width-2', 7, 9);
  });

  it('decodes correctly when the raw stream spans multiple deflate blocks', () => {
    // 8 * 100 = 800px → raw scanline data is ~161KB, above the 65535-byte
    // stored-block limit, so the zlib stream must be split correctly.
    expectPixelsMatchGrid('multi-block', 8, 100);
  });

  it('honors explicit colors in the decoded pixels', () => {
    const png = decode(toPng({ seed: 'explicit', bgcolor: '#ffffff', scale: 1 }));
    const icon = createIcon({ seed: 'explicit', bgcolor: '#ffffff' });
    const first = icon.grid.indexOf(0);
    const o = first * 4;
    expect([png.data[o], png.data[o + 1], png.data[o + 2]]).toEqual([255, 255, 255]);
  });

  it('rejects invalid scales', () => {
    expect(() => toPng({ seed: 'x', scale: 0 })).toThrow(RangeError);
    expect(() => toPng({ seed: 'x', scale: 1.5 })).toThrow(RangeError);
  });
});

describe('toPngDataURL', () => {
  it('encodes the exact toPng bytes as base64', () => {
    const url = toPngDataURL({ seed: 'dataurl' });
    expect(url.startsWith('data:image/png;base64,')).toBe(true);
    const decoded = Buffer.from(url.slice('data:image/png;base64,'.length), 'base64');
    expect(new Uint8Array(decoded)).toEqual(toPng({ seed: 'dataurl' }));
  });

  it('pads base64 correctly regardless of byte length', () => {
    // Different scales shift the total byte count across all mod-3 cases.
    for (const scale of [1, 2, 3, 4, 5]) {
      const url = toPngDataURL({ seed: 'padding', scale });
      const b64 = url.slice('data:image/png;base64,'.length);
      expect(b64.length % 4).toBe(0);
      expect(new Uint8Array(Buffer.from(b64, 'base64'))).toEqual(toPng({ seed: 'padding', scale }));
    }
  });
});

describe('iconToPng', () => {
  it('encodes precomputed icon data exactly like toPng', () => {
    const icon = createIcon({ seed: 'precomputed' });
    expect(iconToPng(icon)).toEqual(toPng({ seed: 'precomputed' }));
    expect(iconToPng(icon, 16)).toEqual(toPng({ seed: 'precomputed', scale: 16 }));
  });

  it('rejects invalid scales', () => {
    const icon = createIcon({ seed: 'x' });
    expect(() => iconToPng(icon, 0)).toThrow(RangeError);
    expect(() => iconToPng(icon, 1.5)).toThrow(RangeError);
  });
});
