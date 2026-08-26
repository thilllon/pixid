import { createIcon, rgbToCss } from '@pixid/core';
import { describe, expect, it } from 'vitest';
import { renderToCanvas } from './index.js';

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
  };
  return { canvas: canvas as unknown as HTMLCanvasElement, calls };
};

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
});
