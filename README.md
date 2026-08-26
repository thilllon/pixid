# pixid

Deterministic blocky identicons from any seed string. Same grid and palette
algorithm as the original [ethereum-blockies](https://github.com/ethereum/blockies),
rewritten in TypeScript with zero runtime dependencies, split into small
packages so you only ship the renderer you actually use.

```
npx pixid 0x8ba1f109551bd432803012645ac136ddd64dba72
```

## Packages

| Package                                                    | What it does                                                                   | Runs in              |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------ | -------------------- |
| [`pixid`](https://npmjs.com/package/pixid)                 | Meta package. Re-exports core + svg + png and ships the `npx pixid` CLI.       | Node, browsers, edge |
| [`@pixid/core`](https://npmjs.com/package/@pixid/core)     | Seed → pixel grid + color palette. Pure data, no rendering.                    | everywhere           |
| [`@pixid/svg`](https://npmjs.com/package/@pixid/svg)       | SVG string / `data:image/svg+xml` URL.                                         | everywhere           |
| [`@pixid/png`](https://npmjs.com/package/@pixid/png)       | PNG file bytes (`Uint8Array`) / `data:image/png` URL, with a built-in encoder. | Node, browsers, edge |
| [`@pixid/canvas`](https://npmjs.com/package/@pixid/canvas) | Renders to an HTML `<canvas>`.                                                 | browsers             |
| [`@pixid/react`](https://npmjs.com/package/@pixid/react)   | `<Pixid />` component rendering inline SVG. Works in server components.        | React 17+            |

Every package is ESM + CJS, fully typed, `sideEffects: false`. Nothing here
depends on `Buffer`, `fs`, `canvas`, or any npm package, so the same code runs
in Node, browsers, and edge runtimes such as Cloudflare Workers.

Measured with esbuild (`minify`, ESM):

| Import                               | Minified bundle |
| ------------------------------------ | --------------- |
| `import { createIcon } from 'pixid'` | 1.8 kB          |
| `import { toSvg } from 'pixid'`      | 2.5 kB          |
| `import { toPng } from 'pixid'`      | 3.6 kB          |
| everything                           | 4.2 kB          |

The tree-shaking behavior is enforced by tests in `e2e/treeshake.test.ts`.

## Usage

### Node

```ts
import { writeFileSync } from 'node:fs';
import { toPng, toSvg, toPngDataURL } from 'pixid';

writeFileSync('avatar.png', toPng({ seed: 'alice', scale: 16 }));
writeFileSync('avatar.svg', toSvg({ seed: 'alice', scale: 16 }));

const url = toPngDataURL({ seed: 'alice' }); // data:image/png;base64,...
```

### Browser, no install

```html
<script type="module">
  import { toSvgDataURL } from 'https://esm.sh/@pixid/svg';
  document.querySelector('img').src = toSvgDataURL({ seed: 'alice' });
</script>
```

Or with a classic script tag (exposes a `pixid` global):

```html
<script src="https://cdn.jsdelivr.net/npm/pixid"></script>
<script>
  img.src = pixid.toPngDataURL({ seed: 'alice', scale: 16 });
</script>
```

### Canvas

```ts
import { createCanvas, renderToCanvas, toCanvasDataURL } from '@pixid/canvas';

document.body.append(createCanvas({ seed: 'alice', scale: 8 }));
renderToCanvas(existingCanvas, { seed: 'alice' });
```

### React

```tsx
import { Pixid } from '@pixid/react';

<Pixid seed="alice" scale={6} className="avatar" />;
```

The component renders inline SVG with no hooks and no browser APIs, so it
works in React Server Components and during SSR without a `"use client"`
boundary.

### CLI

```
npx pixid [seed] [options]

  -s, --seed <seed>       seed string (same as the positional argument)
  -o, --out <file>        output path (default: <seed>.<format>)
  -f, --format <format>   png or svg (default: inferred from --out, else png)
      --size <n>          cells per side (default: 8)
      --scale <n>         pixels per cell (default: 16)
      --color <color>     foreground color, #rgb or #rrggbb
      --bgcolor <color>   background color, #rgb or #rrggbb
      --spotcolor <color> accent color, #rgb or #rrggbb
  -h, --help
  -v, --version
```

```
npx pixid                                   # random seed, writes <seed>.png
npx pixid alice --out alice.svg --scale 32
npx pixid --seed alice --bgcolor "#ffffff"
```

A cold `npx pixid` downloads four tarballs totaling about 13 kB.

## API

### Options

All entry points accept the same options:

| Option      | Type                | Default           | Description                                         |
| ----------- | ------------------- | ----------------- | --------------------------------------------------- |
| `seed`      | `string`            | random            | Same seed, same icon. Ethereum addresses work well. |
| `size`      | `number`            | `8`               | Cells per side.                                     |
| `scale`     | `number`            | `4` (CLI: `16`)   | Pixels per cell.                                    |
| `color`     | `[r,g,b]` or `#hex` | derived from seed | Foreground color.                                   |
| `bgcolor`   | `[r,g,b]` or `#hex` | derived from seed | Background color.                                   |
| `spotcolor` | `[r,g,b]` or `#hex` | derived from seed | Accent color.                                       |

### `@pixid/core`

- `createIcon(options): IconData` — computes `{ seed, size, grid, color, bgcolor, spotcolor }`. `grid` is a row-major array of `0 | 1 | 2` (background / foreground / spot).
- `iconRuns(icon): CellRun[]` — collapses the grid into horizontal runs, used by the renderers.
- `parseColor(input): RGB`, `rgbToCss(rgb): string` — color helpers.

### `@pixid/svg`

- `toSvg(options): string`
- `toSvgDataURL(options): string`
- `iconToSvg(icon, scale): string` — render precomputed `IconData`.

### `@pixid/png`

- `toPng(options): Uint8Array`
- `toPngDataURL(options): string`
- `iconToPng(icon, scale): Uint8Array`

The encoder writes indexed-color PNGs (3-entry palette, 2 bits per pixel)
with stored deflate blocks, so it needs no compression library and produces
identical bytes on every runtime. A 128×128 icon is about 4 kB.

### `@pixid/canvas`

- `renderToCanvas(canvas, options): HTMLCanvasElement`
- `createCanvas(options): HTMLCanvasElement`
- `toCanvasDataURL(options): string`
- `renderIconToCanvas(icon, canvas, scale): HTMLCanvasElement`

### `@pixid/react`

- `<Pixid seed size scale color bgcolor spotcolor {...svgProps} />`

## Compatibility

The PRNG (xorshift seeded from the string), the draw order (foreground,
background, spot color, then grid), and the mirroring rules are identical to
ethereum-blockies, verified against a direct port of the original code in
`packages/core/test/core.test.ts`. Icons for the same seed look the same as
classic blockies, including the MetaMask-style ones for Ethereum addresses.

This project supersedes [`blockies-typed`](https://npmjs.com/package/blockies-typed).
Migration: `createBuffer(opts)` → `toPng(opts)`, `createDataURL(opts)` →
`toPngDataURL(opts)`, `npx blockies-typed` → `npx pixid`. Note that
`blockies-typed` deviated from the original draw order; pixid follows the
original, so icons for the same seed differ from `blockies-typed` output.

## Development

```
pnpm install
pnpm build        # tsup, all packages
pnpm test         # unit tests
pnpm e2e          # tree-shaking checks + publish/npx flow against a local verdaccio registry
```

Releases are managed with [changesets](https://github.com/changesets/changesets):
`pnpm changeset` to record a change, merge the generated "Version Packages"
PR to publish.

## License

MIT
