import { toSvg } from '@pixid/svg';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRef, type ForwardRefRenderFunction, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { Pixid, type PixidProps } from './index.js';

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

  it('renders the same markup as the JSX version it replaced', () => {
    // Recorded from the previous component, which used JSX and no forwardRef.
    // The first case is the example in the README's API section.
    expect(
      renderToStaticMarkup(
        <Pixid seed="alice" size={2} scale={24} className="avatar" role="img" aria-label="alice" />,
      ),
    ).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 2 2" ' +
        'shape-rendering="crispEdges" class="avatar" role="img" aria-label="alice">' +
        '<rect width="2" height="2" fill="rgb(44,38,18)"></rect>' +
        '<rect x="0" y="0" width="2" height="1" fill="rgb(27,12,11)"></rect></svg>',
    );
    expect(renderToStaticMarkup(<Pixid seed="alice" size={2} width="100%" height="100%" />)).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 2 2" ' +
        'shape-rendering="crispEdges"><rect width="2" height="2" fill="rgb(44,38,18)"></rect>' +
        '<rect x="0" y="0" width="2" height="1" fill="rgb(27,12,11)"></rect></svg>',
    );
  });

  it('is a forwardRef component named Pixid', () => {
    expect(Pixid.$$typeof).toBe(Symbol.for('react.forward_ref'));
    expect(Pixid.displayName).toBe('Pixid');
  });

  it('hands the ref to the root <svg>', () => {
    // React 17 and 18 call a forwardRef render function with (props, ref) and
    // never put `ref` in props, so call it that way. React warns unless the
    // render function declares exactly those two parameters.
    const { render } = Pixid as unknown as {
      render: ForwardRefRenderFunction<SVGSVGElement, PixidProps>;
    };
    expect(render).toHaveLength(2);

    const ref = createRef<SVGSVGElement>();
    const svg = render({ seed: 'ref' }, ref) as ReactElement<{ ref: unknown }>;
    expect(svg.type).toBe('svg');
    // React 19, which these tests run on, keeps `ref` in the element's props.
    expect(svg.props.ref).toBe(ref);
  });

  it('accepts any finite positive scale', () => {
    const width = (scale: number | undefined) =>
      svgAttrs(renderToStaticMarkup(<Pixid seed="scale" size={2} scale={scale} />)).width;
    expect(width(undefined)).toBe('8');
    expect(width(1.5)).toBe('3');
    expect(width(24)).toBe('48');
  });

  it('rejects a scale that is not a finite positive number', () => {
    for (const scale of [0, -1, NaN, Infinity, -Infinity]) {
      expect(() => renderToStaticMarkup(<Pixid seed="x" scale={scale} />)).toThrow(RangeError);
    }
    expect(() => renderToStaticMarkup(<Pixid seed="x" scale={-1} />)).toThrow(
      'invalid scale: -1 (expected a finite positive number)',
    );
  });
});

describe('built output', () => {
  const dist = (file: string) => fileURLToPath(new URL(`../dist/${file}`, import.meta.url));

  it('imports only react and @pixid/core, never react/jsx-runtime', () => {
    // React 17 has no exports map, so Node's ESM resolver cannot find the
    // `react/jsx-runtime` subpath; `react` itself resolves through `main`.
    const esm = readFileSync(dist('index.js'), 'utf8');
    const cjs = readFileSync(dist('index.cjs'), 'utf8');
    expect(esm).not.toContain('react/jsx-runtime');
    expect(cjs).not.toContain('react/jsx-runtime');

    const specifiers = (code: string, re: RegExp) => [...code.matchAll(re)].map((m) => m[1]).sort();
    expect(specifiers(esm, /\bfrom\s*"([^"]+)"/g)).toEqual(['@pixid/core', 'react']);
    expect(specifiers(cjs, /\brequire\("([^"]+)"\)/g)).toEqual(['@pixid/core', 'react']);
  });

  it('renders without React warnings, including the outdated-JSX-transform one', async () => {
    // React 19 warns from createElement when it sees the `__self` prop that a
    // development-mode classic JSX transform adds. Tests run React's
    // development build, where that check is active.
    const { Pixid: Built } = (await import(dist('index.js'))) as typeof import('./index.js');
    const warn = vi.spyOn(console, 'warn');
    const error = vi.spyOn(console, 'error');
    try {
      expect(renderToStaticMarkup(<Built seed="dist" />)).toBe(
        renderToStaticMarkup(<Pixid seed="dist" />),
      );
      expect(warn).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
      error.mockRestore();
    }
  });
});
