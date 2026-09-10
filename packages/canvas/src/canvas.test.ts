import { createIcon, rgbToCss } from '@pixid/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCanvas, renderIconToCanvas, renderToCanvas, toCanvasDataURL } from './index.js';

interface FillCall {
  fillStyle: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Minimal recording stand-in for a canvas 2d context. */
const makeMockCanvas = () => {
  const calls: FillCall[] = [];
  const ctx = {
    fillStyle: '',
    fillRect(x: number, y: number, w: number, h: number) {
      calls.push({ fillStyle: this.fillStyle, x, y, w, h });
    },
  };
  const canvas = {
    width: 0,
    height: 0,
    getContext: (kind: string) => (kind === '2d' ? ctx : null),
    toDataURL: (type: string) => `data:${type};mock`,
  };
  return { canvas: canvas as unknown as HTMLCanvasElement, calls };
};

/**
 * The unit tests run in Node, which has no `document`. Stubs just enough of
 * one for createCanvas and toCanvasDataURL and returns the mocks it hands out.
 */
const stubDocument = () => {
  const created: ReturnType<typeof makeMockCanvas>[] = [];
  vi.stubGlobal('document', {
    createElement: (tag: string) => {
      expect(tag).toBe('canvas');
      const mock = makeMockCanvas();
      created.push(mock);
      return mock.canvas;
    },
  });
  return created;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Scales a canvas cannot be sized from: canvas dimensions are whole pixels. */
const INVALID_SCALES = [0, -4, 1.5, NaN, Infinity];

describe('renderToCanvas', () => {
  it('sizes the canvas and paints the full background first', () => {
    const { canvas, calls } = makeMockCanvas();
    renderToCanvas(canvas, { seed: 'bg', size: 8, scale: 5 });

    expect(canvas.width).toBe(40);
    expect(canvas.height).toBe(40);

    const icon = createIcon({ seed: 'bg', size: 8 });
    expect(calls[0]).toEqual({ fillStyle: rgbToCss(icon.bgcolor), x: 0, y: 0, w: 40, h: 40 });
  });

  it('draws fill calls that reproduce exactly the core grid', () => {
    for (const seed of ['canvas-a', 'canvas-b']) {
      const size = 8;
      const scale = 3;
      const { canvas, calls } = makeMockCanvas();
      renderToCanvas(canvas, { seed, size, scale });

      const icon = createIcon({ seed, size });
      const colorToValue = new Map([
        [rgbToCss(icon.bgcolor), 0],
        [rgbToCss(icon.color), 1],
        [rgbToCss(icon.spotcolor), 2],
      ]);

      // Replay every fill call onto a virtual grid.
      const rebuilt = new Array(size * size).fill(-1);
      for (const call of calls) {
        const value = colorToValue.get(call.fillStyle);
        expect(value, `unexpected fillStyle ${call.fillStyle}`).toBeDefined();
        expect(call.x % scale).toBe(0);
        expect(call.y % scale).toBe(0);
        expect(call.w % scale).toBe(0);
        expect(call.h % scale).toBe(0);
        for (let dy = 0; dy < call.h / scale; dy++) {
          for (let dx = 0; dx < call.w / scale; dx++) {
            rebuilt[(call.y / scale + dy) * size + (call.x / scale + dx)] = value;
          }
        }
      }
      expect(rebuilt).toEqual([...icon.grid]);
    }
  });

  it('returns the same canvas instance it rendered to', () => {
    const { canvas } = makeMockCanvas();
    expect(renderToCanvas(canvas, { seed: 'identity' })).toBe(canvas);
  });

  it('throws when a 2d context is unavailable', () => {
    const canvas = { width: 0, height: 0, getContext: () => null } as unknown as HTMLCanvasElement;
    expect(() => renderToCanvas(canvas, { seed: 'x' })).toThrow(/2d context/);
  });

  it('rejects invalid scales before touching the canvas', () => {
    const { canvas, calls } = makeMockCanvas();
    canvas.width = 300;
    canvas.height = 150;
    for (const scale of INVALID_SCALES) {
      expect(() => renderToCanvas(canvas, { seed: 'x', scale }), `scale=${scale}`).toThrow(
        RangeError,
      );
    }
    expect(() => renderToCanvas(canvas, { seed: 'x', scale: 1.5 })).toThrow(
      'invalid scale: 1.5 (expected a positive integer)',
    );
    expect([canvas.width, canvas.height]).toEqual([300, 150]);
    expect(calls).toEqual([]);
  });
});

describe('renderIconToCanvas', () => {
  it('rejects invalid scales before touching the canvas', () => {
    const icon = createIcon({ seed: 'x' });
    const { canvas, calls } = makeMockCanvas();
    canvas.width = 300;
    canvas.height = 150;
    for (const scale of INVALID_SCALES) {
      expect(() => renderIconToCanvas(icon, canvas, scale), `scale=${scale}`).toThrow(RangeError);
    }
    expect([canvas.width, canvas.height]).toEqual([300, 150]);
    expect(calls).toEqual([]);
  });
});

describe('createCanvas and toCanvasDataURL', () => {
  it('render into a new canvas element', () => {
    const created = stubDocument();
    const canvas = createCanvas({ seed: 'fresh', scale: 5 });
    expect(canvas).toBe(created[0]!.canvas);
    expect(canvas.width).toBe(40);
    expect(created[0]!.calls.length).toBeGreaterThan(0);
    expect(toCanvasDataURL({ seed: 'fresh' })).toBe('data:image/png;mock');
  });

  it('reject invalid scales', () => {
    stubDocument();
    for (const scale of INVALID_SCALES) {
      expect(() => createCanvas({ seed: 'x', scale }), `scale=${scale}`).toThrow(RangeError);
      expect(() => toCanvasDataURL({ seed: 'x', scale }), `scale=${scale}`).toThrow(RangeError);
    }
  });
});
