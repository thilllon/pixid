import { PNG } from 'pngjs';
import { describe, expect, it, vi } from 'vitest';
import { createIcon, toPng, toPngDataURL } from './index.js';

/**
 * pngjs acts as an independent decoder oracle: if it can parse our output,
 * the signature, chunk layout, CRCs, zlib stream, and bit packing are all
 * spec-conformant.
 */
const decode = (bytes: Uint8Array) => PNG.sync.read(Buffer.from(bytes));

const expectPixelsMatchGrid = (seed: string, size: number, scale: number) => {
  const icon = createIcon({ seed, size });
  const png = decode(toPng(icon, scale));
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
    const bytes = toPng(createIcon({ seed: 'signature' }));
    expect([...bytes.slice(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  });

  it('is deterministic for the same icon data', () => {
    expect(toPng(createIcon({ seed: 'stable' }), 7)).toEqual(
      toPng(createIcon({ seed: 'stable' }), 7),
    );
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
    const icon = createIcon({ seed: 'explicit', bgcolor: '#ffffff' });
    const png = decode(toPng(icon, 1));
    const first = icon.grid.indexOf(0);
    const o = first * 4;
    expect([png.data[o], png.data[o + 1], png.data[o + 2]]).toEqual([255, 255, 255]);
  });

  it('rejects invalid scales', () => {
    const icon = createIcon({ seed: 'x' });
    expect(() => toPng(icon, 0)).toThrow(RangeError);
    expect(() => toPng(icon, 1.5)).toThrow(RangeError);
  });
});

describe('toPng input', () => {
  it('rejects options and anything else that is not icon data', () => {
    for (const fn of [toPng, toPngDataURL]) {
      for (const input of [{ seed: 'alice', scale: 16 }, undefined, null, 'alice']) {
        expect(() => fn(input as never), `${fn.name}(${JSON.stringify(input)})`).toThrow(TypeError);
      }
    }
    expect(() => toPng({ seed: 'alice' } as never)).toThrow(
      'toPng: expected icon data from createIcon()',
    );
    expect(() => toPngDataURL({ seed: 'alice' } as never)).toThrow(
      'toPngDataURL: expected icon data from createIcon()',
    );
  });

  it('writes valid CRCs on the first call in a fresh module, when the table is built', async () => {
    // Every other test runs after some earlier toPng call has built and cached
    // the CRC table, so only a fresh module instance exercises the first build.
    vi.resetModules();
    const fresh = await import('./index.js');
    const icon = fresh.createIcon({ seed: 'first-crc' });
    const first = fresh.toPng(icon);
    const second = fresh.toPng(icon);
    // pngjs verifies every chunk CRC while decoding.
    expect(() => decode(first)).not.toThrow();
    expect(first).toEqual(second);
    expect(first).toEqual(toPng(createIcon({ seed: 'first-crc' })));
  });
});

describe('toPngDataURL', () => {
  it('encodes the exact toPng bytes as base64', () => {
    const icon = createIcon({ seed: 'dataurl' });
    const url = toPngDataURL(icon);
    expect(url.startsWith('data:image/png;base64,')).toBe(true);
    const decoded = Buffer.from(url.slice('data:image/png;base64,'.length), 'base64');
    expect(new Uint8Array(decoded)).toEqual(toPng(icon));
  });

  it('pads base64 correctly regardless of byte length', () => {
    // Different scales shift the total byte count across all mod-3 cases.
    const icon = createIcon({ seed: 'padding' });
    for (const scale of [1, 2, 3, 4, 5]) {
      const url = toPngDataURL(icon, scale);
      const b64 = url.slice('data:image/png;base64,'.length);
      expect(b64.length % 4).toBe(0);
      expect(new Uint8Array(Buffer.from(b64, 'base64'))).toEqual(toPng(icon, scale));
    }
  });
});
