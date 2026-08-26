import { toSvg } from '@pixid/svg';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Pixid } from '../src/index.js';

const RECT_RE = /<rect[^>]*\/?>/g;
const ATTR_RE = /([a-zA-Z-]+)="([^"]*)"/g;

const normalizeRects = (markup: string) =>
  [...markup.matchAll(RECT_RE)]
    .map((m) => {
      const attrs: Record<string, string> = {};
      for (const [, name, value] of m[0].matchAll(ATTR_RE)) {
        attrs[name!] = value!;
      }
      return attrs;
    })
    .map((a) => `${a.x ?? '0'},${a.y ?? '0'},${a.width},${a.height ?? ''},${a.fill}`)
    .sort();

const svgAttrs = (markup: string): Record<string, string> => {
  const tag = /<svg([^>]*)>/.exec(markup)?.[1] ?? '';
  const attrs: Record<string, string> = {};
  for (const [, name, value] of tag.matchAll(ATTR_RE)) {
    attrs[name!] = value!;
  }
  return attrs;
};

describe('Pixid', () => {
  it('renders during SSR without hooks or browser APIs', () => {
    const markup = renderToStaticMarkup(<Pixid seed="ssr" />);
    expect(markup.startsWith('<svg')).toBe(true);
    expect(markup.endsWith('</svg>')).toBe(true);
  });

  it('renders the same rects as @pixid/svg for identical options', () => {
    for (const seed of ['react-cross-1', 'react-cross-2']) {
      const markup = renderToStaticMarkup(<Pixid seed={seed} size={9} scale={6} />);
      const reference = toSvg({ seed, size: 9, scale: 6 });

      expect(normalizeRects(markup)).toEqual(normalizeRects(reference));

      const a = svgAttrs(markup);
      const b = svgAttrs(reference);
      expect(a.width).toBe(b.width);
      expect(a.height).toBe(b.height);
      expect(a.viewBox).toBe(b.viewBox);
      expect(a['shape-rendering']).toBe(b['shape-rendering']);
    }
  });

  it('is deterministic for the same seed', () => {
    expect(renderToStaticMarkup(<Pixid seed="stable" />)).toBe(
      renderToStaticMarkup(<Pixid seed="stable" />),
    );
  });

  it('honors explicit colors', () => {
    const markup = renderToStaticMarkup(<Pixid seed="c" bgcolor="#ffffff" color={[1, 2, 3]} />);
    expect(markup).toContain('fill="rgb(255,255,255)"');
    expect(markup).toContain('fill="rgb(1,2,3)"');
  });

  it('passes through extra SVG props', () => {
    const markup = renderToStaticMarkup(
      <Pixid seed="props" className="avatar" data-testid="icon" style={{ borderRadius: 4 }} />,
    );
    expect(markup).toContain('class="avatar"');
    expect(markup).toContain('data-testid="icon"');
    expect(markup).toContain('border-radius:4px');
  });
});
