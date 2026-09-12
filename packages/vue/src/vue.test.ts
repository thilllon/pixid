import { toSvg } from '@pixid/svg';
import { renderToString } from '@vue/server-renderer';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createSSRApp } from 'vue';
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

/**
 * Renders through `@vue/server-renderer`, which exercises the component the
 * way SSR does: no DOM, no lifecycle hooks. Anything outside `PixidProps` is
 * a fallthrough attribute, so the signature accepts both.
 */
const render = (props: PixidProps & Record<string, unknown>, component = Pixid) =>
  renderToString(createSSRApp(component, props));

describe('Pixid', () => {
  it('renders during SSR without hooks or browser APIs', async () => {
    const markup = await render({ seed: 'ssr' });
    expect(markup.startsWith('<svg')).toBe(true);
    expect(markup.endsWith('</svg>')).toBe(true);
  });

  it('renders the same rects as @pixid/svg for identical options', async () => {
    for (const seed of ['vue-cross-1', 'vue-cross-2']) {
      const markup = await render({ seed, size: 9, scale: 6 });
      const reference = toSvg({ seed, size: 9, scale: 6 });

      expect(normalizeRects(markup)).toEqual(normalizeRects(reference));

      const a = svgAttrs(markup);
      const b = svgAttrs(reference);
      expect(a.xmlns).toBe(b.xmlns);
      expect(a.width).toBe(b.width);
      expect(a.height).toBe(b.height);
      expect(a.viewBox).toBe(b.viewBox);
      expect(a['shape-rendering']).toBe(b['shape-rendering']);
    }
  });

  it('is deterministic for the same seed', async () => {
    expect(await render({ seed: 'stable' })).toBe(await render({ seed: 'stable' }));
  });

  it('defaults to 8 cells at scale 4', async () => {
    const attrs = svgAttrs(await render({ seed: 'defaults' }));
    expect(attrs.viewBox).toBe('0 0 8 8');
    expect(attrs.width).toBe('32');
    expect(attrs.height).toBe('32');
  });

  it('takes a number or bigint seed, like every other entry point', async () => {
    // `createIcon` converts those with `String()`, so the runtime prop
    // declaration lists them too; a bare `type: String` would render the right
    // icon but warn first, which no other package does.
    const warn = vi.spyOn(console, 'warn');
    try {
      const reference = await render({ seed: '42', size: 2 });
      for (const seed of [42, 42n] as unknown as string[]) {
        expect(await render({ seed, size: 2 })).toBe(reference);
      }
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  it('honors explicit colors', async () => {
    const markup = await render({ seed: 'c', bgcolor: '#ffffff', color: [1, 2, 3] });
    expect(markup).toContain('fill="rgb(255,255,255)"');
    expect(markup).toContain('fill="rgb(1,2,3)"');
  });

  it('lands fallthrough attributes on the root <svg>', async () => {
    const markup = await render({
      seed: 'props',
      class: 'avatar',
      'data-testid': 'icon',
      style: { borderRadius: '4px' },
    });
    expect(markup).toContain('class="avatar"');
    expect(markup).toContain('data-testid="icon"');
    expect(markup).toContain('border-radius:4px');
  });

  it('lets a fallthrough attribute override a computed one', async () => {
    // Vue merges `$attrs` after the render function's own props, so the
    // parent's value wins for a name the component already set.
    const attrs = svgAttrs(
      await render({ seed: 'override', width: '100%', height: '100%', viewBox: '0 0 1 1' }),
    );
    expect(attrs.width).toBe('100%');
    expect(attrs.height).toBe('100%');
    expect(attrs.viewBox).toBe('0 0 1 1');
  });

  it('renders the markup the README documents', async () => {
    // Byte for byte what `@pixid/react` renders for the same props; only the
    // two packages' attribute serialization could differ, and it does not.
    expect(
      await render({
        seed: 'alice',
        size: 2,
        scale: 24,
        class: 'avatar',
        role: 'img',
        'aria-label': 'alice',
      }),
    ).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 2 2" ' +
        'shape-rendering="crispEdges" class="avatar" role="img" aria-label="alice">' +
        '<rect width="2" height="2" fill="rgb(44,38,18)"></rect>' +
        '<rect x="0" y="0" width="2" height="1" fill="rgb(27,12,11)"></rect></svg>',
    );
    expect(await render({ seed: 'alice', size: 2, width: '100%', height: '100%' })).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 2 2" ' +
        'shape-rendering="crispEdges"><rect width="2" height="2" fill="rgb(44,38,18)"></rect>' +
        '<rect x="0" y="0" width="2" height="1" fill="rgb(27,12,11)"></rect></svg>',
    );
  });

  it('serializes viewBox, which is what the vue peer floor buys', async () => {
    // `@vue/server-renderer` lowercased every camelCase attribute name before
    // 3.2.40, and SVG attribute names are case-sensitive: `viewbox` is not a
    // viewBox, so the icon — drawn in cell units — would render as a speck in
    // the corner, and hydration would not repair it. `viewBox` is the only
    // camelCase attribute the component emits, which is why the peer range
    // starts at that release rather than at 3.
    expect(await render({ seed: 'viewbox', size: 2 })).toContain('viewBox="0 0 2 2"');
    const manifest = JSON.parse(
      readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8'),
    ) as { peerDependencies: { vue: string } };
    expect(manifest.peerDependencies.vue).toBe('>=3.2.40');
  });

  it('is named Pixid and declares exactly the PixidProps names', () => {
    // The name survives minification, so devtools and Vue's warnings show it.
    expect(Pixid.name).toBe('Pixid');
    // Every declared prop is one Vue keeps out of `$attrs`; anything missing
    // here would be rendered as an attribute on the `<svg>` instead.
    expect(Object.keys(Pixid.props)).toEqual([
      'seed',
      'size',
      'scale',
      'color',
      'bgcolor',
      'spotcolor',
    ]);
  });

  it('renders without Vue warnings', async () => {
    const warn = vi.spyOn(console, 'warn');
    const error = vi.spyOn(console, 'error');
    try {
      await render({ seed: 'quiet', size: 5, scale: 3, class: 'avatar' });
      expect(warn).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
      error.mockRestore();
    }
  });

  it('accepts any finite positive scale', async () => {
    const width = async (scale: number | undefined) =>
      svgAttrs(await render({ seed: 'scale', size: 2, scale })).width;
    expect(await width(undefined)).toBe('8');
    expect(await width(1.5)).toBe('3');
    expect(await width(24)).toBe('48');
  });

  it('rejects a scale that is not a finite positive number', async () => {
    // Vue catches a render-function throw and rethrows it, after logging an
    // "Unhandled error" warning, so the rejection carries the original error.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      for (const scale of [0, -1, NaN, Infinity, -Infinity]) {
        await expect(render({ seed: 'x', scale })).rejects.toThrow(RangeError);
      }
      await expect(render({ seed: 'x', scale: -1 })).rejects.toThrow(
        'invalid scale: -1 (expected a finite positive number)',
      );
    } finally {
      warn.mockRestore();
    }
  });
});

describe('built output', () => {
  const dist = (file: string) => fileURLToPath(new URL(`../dist/${file}`, import.meta.url));

  it('imports only vue and @pixid/core', async () => {
    const esm = readFileSync(dist('index.js'), 'utf8');
    const cjs = readFileSync(dist('index.cjs'), 'utf8');
    const specifiers = (code: string, re: RegExp) => [...code.matchAll(re)].map((m) => m[1]).sort();
    expect(specifiers(esm, /\bfrom\s*"([^"]+)"/g)).toEqual(['@pixid/core', 'vue']);
    expect(specifiers(cjs, /\brequire\("([^"]+)"\)/g)).toEqual(['@pixid/core', 'vue']);
  });

  it('renders the same markup from dist as from source', async () => {
    const { Pixid: Built } = (await import(dist('index.js'))) as typeof import('./index.js');
    expect(Built.name).toBe('Pixid');
    expect(await render({ seed: 'dist' }, Built)).toBe(await render({ seed: 'dist' }));
  });
});
