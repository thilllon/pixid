import { createIcon, rgbToCss } from '@pixid/core';
import { describe, expect, it } from 'vitest';
import { iconToSvg, toSvg, toSvgDataURL } from './index.js';

const RECT_RE =
  /<rect(?: x="(\d+)")?(?: y="(\d+)")? width="(\d+)" height="(\d+)" fill="([^"]+)"\/>/g;

/** Rebuilds the cell grid by replaying every rect in the SVG markup. */
const gridFromSvg = (svg: string, size: number): number[] => {
  const grid = new Array(size * size).fill(-1);
  const palette = new Map<string, number>();

  for (const match of svg.matchAll(RECT_RE)) {
    const [, xs, ys, ws, hs, fill] = match;
    const x = Number(xs ?? 0);
    const y = Number(ys ?? 0);
    const w = Number(ws);
    const h = Number(hs);
    if (!palette.has(fill!)) palette.set(fill!, palette.size);
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        grid[(y + dy) * size + (x + dx)] = palette.get(fill!)!;
      }
    }
  }
  return grid;
};

describe('toSvg', () => {
  it('is deterministic for the same options', () => {
    expect(toSvg({ seed: 'stable' })).toBe(toSvg({ seed: 'stable' }));
  });

  it('emits a standalone svg document with the right dimensions', () => {
    const svg = toSvg({ seed: 'dims', size: 8, scale: 10 });
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    expect(svg.endsWith('</svg>')).toBe(true);
    expect(svg).toContain('width="80"');
    expect(svg).toContain('height="80"');
    expect(svg).toContain('viewBox="0 0 8 8"');
    expect(svg).toContain('shape-rendering="crispEdges"');
  });

  it('renders exactly the grid produced by @pixid/core', () => {
    for (const seed of ['cross-check-1', 'cross-check-2', '0xdeadbeef']) {
      const icon = createIcon({ seed, size: 9 });
      const svg = toSvg({ seed, size: 9 });

      // Replay rects in document order: the background rect paints everything
      // first, then runs overwrite it, mirroring how a renderer draws.
      const rebuilt = gridFromSvg(svg, 9);

      const paletteInOrder = [rgbToCss(icon.bgcolor)];
      const expected = [...icon.grid].map((v) => {
        const css = [rgbToCss(icon.bgcolor), rgbToCss(icon.color), rgbToCss(icon.spotcolor)][v]!;
        let idx = paletteInOrder.indexOf(css);
        if (idx === -1) {
          paletteInOrder.push(css);
          idx = paletteInOrder.length - 1;
        }
        return idx;
      });
      expect(rebuilt).toEqual(expected);
    }
  });

  it('uses the palette colors from the icon data', () => {
    const icon = createIcon({ seed: 'palette' });
    const svg = toSvg({ seed: 'palette' });
    expect(svg).toContain(`fill="${rgbToCss(icon.bgcolor)}"`);
    expect(svg).toContain(`fill="${rgbToCss(icon.color)}"`);
  });

  it('honors explicit colors', () => {
    const svg = toSvg({ seed: 'colors', bgcolor: '#ffffff', color: [10, 20, 30] });
    expect(svg).toContain('fill="rgb(255,255,255)"');
    expect(svg).toContain('fill="rgb(10,20,30)"');
  });

  it('changes only the rendered dimensions when scale changes', () => {
    const small = toSvg({ seed: 'scaled', scale: 1 });
    const large = toSvg({ seed: 'scaled', scale: 100 });
    expect(small.replace('width="8" height="8"', 'width="800" height="800"')).toBe(large);
  });
});

describe('toSvgDataURL', () => {
  it('round-trips through decodeURIComponent', () => {
    const url = toSvgDataURL({ seed: 'dataurl' });
    expect(url.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true);
    const decoded = decodeURIComponent(url.slice('data:image/svg+xml;charset=utf-8,'.length));
    expect(decoded).toBe(toSvg({ seed: 'dataurl' }));
  });
});

describe('iconToSvg', () => {
  it('renders precomputed icon data exactly like toSvg', () => {
    const icon = createIcon({ seed: 'precomputed' });
    expect(iconToSvg(icon)).toBe(toSvg({ seed: 'precomputed' }));
    expect(iconToSvg(icon, 16)).toBe(toSvg({ seed: 'precomputed', scale: 16 }));
  });
});
