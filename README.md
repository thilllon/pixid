# pixid

Deterministic blocky identicons from any seed string, compatible with
[ethereum-blockies](https://github.com/ethereum/blockies). TypeScript, zero
dependencies beyond `@pixid/core`, and the same bytes on every runtime.

[![npm](https://img.shields.io/npm/v/%40pixid%2Fcore?logo=npm&label=npm)](https://www.npmjs.com/package/@pixid/core)
[![downloads](https://img.shields.io/npm/d18m/%40pixid%2Fcore?logo=npm&label=downloads)](https://www.npmjs.com/package/@pixid/core)
[![CI](https://img.shields.io/github/actions/workflow/status/thilllon/pixid/ci.yml?branch=main&logo=githubactions&logoColor=white&label=CI)](https://github.com/thilllon/pixid/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/%40pixid%2Fcore?color=blue)](./LICENSE)

<table>
  <tr>
    <td align="center"><img src="https://raw.githubusercontent.com/thilllon/pixid/main/assets/eth-d8da6b.png" width="72" alt="identicon for 0xd8da6bf26964af9d7eed9e03e53415d37aa96045" /></td>
    <td align="center"><img src="https://raw.githubusercontent.com/thilllon/pixid/main/assets/eth-8ba1f1.png" width="72" alt="identicon for 0x8ba1f109551bd432803012645ac136ddd64dba72" /></td>
    <td align="center"><img src="https://raw.githubusercontent.com/thilllon/pixid/main/assets/eth-ab5801.png" width="72" alt="identicon for 0xab5801a7d398351b8be11c439e05c5b3259aec9b" /></td>
    <td align="center"><img src="https://raw.githubusercontent.com/thilllon/pixid/main/assets/uuid-550e8400.png" width="72" alt="identicon for 550e8400-e29b-41d4-a716-446655440000" /></td>
  </tr>
  <tr>
    <td align="center"><sub><code>0xd8da6b…96045</code></sub></td>
    <td align="center"><sub><code>0x8ba1f1…dba72</code></sub></td>
    <td align="center"><sub><code>0xab5801…aec9b</code></sub></td>
    <td align="center"><sub><code>550e8400…440000</code></sub></td>
  </tr>
  <tr>
    <td align="center"><img src="https://raw.githubusercontent.com/thilllon/pixid/main/assets/pixid.png" width="72" alt="identicon for pixid" /></td>
    <td align="center"><img src="https://raw.githubusercontent.com/thilllon/pixid/main/assets/alice.png" width="72" alt="identicon for alice" /></td>
    <td align="center"><img src="https://raw.githubusercontent.com/thilllon/pixid/main/assets/bob.png" width="72" alt="identicon for bob" /></td>
    <td align="center"><img src="https://raw.githubusercontent.com/thilllon/pixid/main/assets/thilllon.png" width="72" alt="identicon for thilllon" /></td>
  </tr>
  <tr>
    <td align="center"><sub><code>pixid</code></sub></td>
    <td align="center"><sub><code>alice</code></sub></td>
    <td align="center"><sub><code>bob</code></sub></td>
    <td align="center"><sub><code>thilllon</code></sub></td>
  </tr>
</table>

Each cell is a 128×128 PNG from `toPng` in `@pixid/core`, shown at 72 px.
Reproduce one with `npx @pixid/cli alice`.

## Install

Install only the package you render with. Each one brings in `@pixid/core`.

```sh
npm i @pixid/core     # SVG and PNG, any runtime
npm i @pixid/canvas   # <canvas>, browsers
npm i @pixid/react    # <Pixid /> for React 17+
npm i @pixid/vue      # <Pixid /> for Vue 3.2.40+
npx @pixid/cli alice  # the command line, nothing installed; see CLI below
```

## Usage

### Node.js

```ts
import { writeFileSync } from 'node:fs';
import { createIcon, toPng, toPngDataURL, toSvg } from '@pixid/core';

const icon = createIcon({ seed: 'alice' });
writeFileSync('alice.png', toPng(icon, 16)); // 128×128 px
writeFileSync('alice.svg', toSvg(icon, 16));
const src = toPngDataURL(icon, 16); // 'data:image/png;base64,...'
```

One `createIcon` call feeds every renderer. `toPng` returns a `Uint8Array`,
which `writeFileSync` accepts as is.

### Browser

With no build step, from a CDN:

```html
<img id="avatar" width="128" height="128" />
<script type="module">
  import { createIcon, toSvgDataURL } from 'https://esm.sh/@pixid/core@1';
  document.getElementById('avatar').src = toSvgDataURL(createIcon({ seed: 'alice' }), 16);
</script>
```

`@pixid/canvas` also ships an IIFE build for classic script tags. It inlines
`@pixid/core` and exposes the global `pixidCanvas`:

```html
<img id="avatar" width="128" height="128" />
<script src="https://cdn.jsdelivr.net/npm/@pixid/canvas@1"></script>
<script>
  document.getElementById('avatar').src = pixidCanvas.toCanvasDataURL({ seed: 'alice', scale: 16 });
</script>
```

The same file is on unpkg at `https://unpkg.com/@pixid/canvas@1`. The other
packages are ESM and CommonJS only.

### Canvas

```ts
import { createCanvas, renderToCanvas } from '@pixid/canvas';

document.body.append(createCanvas({ seed: 'alice', scale: 8 })); // a new 64×64 canvas
renderToCanvas(document.querySelector('canvas')!, { seed: 'alice', scale: 8 }); // resized to fit
```

These need a DOM. In Node.js, use `toPng` from `@pixid/core`.

### React

```tsx
import { Pixid } from '@pixid/react';

export const Avatar = ({ name }: { name: string }) => (
  <Pixid seed={name} scale={6} role="img" aria-label={name} />
);
```

The component renders inline SVG with no hooks or browser APIs, so it works in
server components without `"use client"`.

### Vue

```vue
<script setup lang="ts">
import { Pixid } from '@pixid/vue';

defineProps<{ name: string }>();
</script>

<template>
  <Pixid :seed="name" :scale="6" role="img" :aria-label="name" />
</template>
```

The component is a plain `h()` render function, so it needs no Vue compiler
and renders under `@vue/server-renderer`.

Both components render the same markup on server and client for a given
`seed`. Without a `seed` the icon is random and hydration will not match.

### Edge runtimes

`@pixid/core` uses only `Math`, typed arrays, and `DataView`: no `Buffer`, no
`zlib`, no Node.js built-ins. A Cloudflare Worker that serves avatars:

```ts
import { createIcon, toPng } from '@pixid/core';

export default {
  fetch(request: Request) {
    const seed = new URL(request.url).pathname.slice(1);
    return new Response(toPng(createIcon({ seed }), 16), {
      headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=31536000' },
    });
  },
};
```

The encoder is synchronous, so there is nothing to await.

## Packages

| Package                                                        | What it does                                                  | Runs in     |
| -------------------------------------------------------------- | ------------------------------------------------------------- | ----------- |
| [`@pixid/core`](https://www.npmjs.com/package/@pixid/core)     | Seed → pixel grid and palette, plus SVG and PNG renderers.    | everywhere  |
| [`@pixid/canvas`](https://www.npmjs.com/package/@pixid/canvas) | Renders to an HTML `<canvas>`.                                | browsers    |
| [`@pixid/react`](https://www.npmjs.com/package/@pixid/react)   | `<Pixid />` rendering inline SVG. Works in server components. | React 17+   |
| [`@pixid/vue`](https://www.npmjs.com/package/@pixid/vue)       | `<Pixid />` rendering inline SVG. Works with SSR.             | Vue 3.2.40+ |
| [`@pixid/cli`](https://www.npmjs.com/package/@pixid/cli)       | The `pixid` command. Writes PNG or SVG files.                 | Node.js 22+ |

Every package is ESM and CommonJS, fully typed, and side-effect free (the CLI's
bin entry is the one module that runs on import). The only runtime dependency
of each package is `@pixid/core`; `react >=17` and `vue >=3.2.40` are peer
dependencies you install yourself. `@pixid/react` and `@pixid/vue` build their
SVG from `@pixid/core`'s data, and their tests check it against `toSvg` rect by
rect.

Supported runtimes:

- **Node.js 22 or later** for every package (`engines.node` is `>=22`). CI
  tests Node.js 22, 24, and 26.
- **Browsers** with ES2022 support. `@pixid/canvas` needs a DOM; the others do
  not.
- **Edge runtimes** such as Cloudflare Workers, for `@pixid/core`,
  `@pixid/react`, and `@pixid/vue`.

## Options

These options are shared by `createIcon`, the `@pixid/canvas` functions, the
React and Vue components, and, as flags, the CLI. Every field is optional.

| Option      | Type         | Default           | Description                                               |
| ----------- | ------------ | ----------------- | --------------------------------------------------------- |
| `seed`      | `string`     | random            | Same seed, same icon.                                     |
| `size`      | `number`     | `8`               | Cells per side. A positive integer.                       |
| `scale`     | `number`     | `4` (CLI: `16`)   | Pixels per cell. The image is `size * scale` pixels wide. |
| `color`     | `ColorInput` | derived from seed | Foreground color (grid value `1`).                        |
| `bgcolor`   | `ColorInput` | derived from seed | Background color (grid value `0`).                        |
| `spotcolor` | `ColorInput` | derived from seed | Accent color (grid value `2`).                            |

**`seed`.** An omitted, `null`, or empty (`''`) seed is replaced by a random
14-character hex string, returned on `IconData.seed`. JavaScript callers may
pass a number or bigint, which is converted with `String()`, so `42`, `42n`,
and `'42'` give the same icon; pass ids above `Number.MAX_SAFE_INTEGER` as
strings. Any other type throws a `TypeError`.

**`scale`.** `createIcon` does not take it: its `IconData` is
resolution-independent, and each renderer takes `scale` as its own argument
(`toSvg(icon, scale)`) or option (`createCanvas({ scale })`, `<Pixid scale>`).
PNG and canvas output need a positive integer, since they fill whole pixels.
SVG output (`toSvg`, React, Vue) takes any finite positive number, such as
`1.5`. Anything else throws a `RangeError`.

**`ColorInput`** is a hex string or an RGB tuple. Anything else throws a
`TypeError`; named CSS colors, `rgb()` strings, and alpha are not supported.

| Form        | Example         | Notes                                    |
| ----------- | --------------- | ---------------------------------------- |
| `#rgb`      | `'#f0a'`        | Case-insensitive, expanded to `#ff00aa`. |
| `#rrggbb`   | `'#ff00aa'`     | Case-insensitive.                        |
| `[r, g, b]` | `[255, 0, 170]` | Three integers in `0..255`.              |

Setting one color changes the rest of the icon too; see
[how a seed becomes an icon](#how-a-seed-becomes-an-icon).

## CLI

```
npx @pixid/cli [seed] [options]
```

The package installs a command named `pixid`; `npm i -g @pixid/cli` puts it on
your `PATH`. There is no unscoped `pixid` package on npm, so run it with
`npx @pixid/cli`.

```sh
npx @pixid/cli                                          # random seed -> <uuid>.png
npx @pixid/cli alice                                    # -> alice.png, 128×128
npx @pixid/cli alice --out avatars/alice.svg            # -> SVG, format inferred
npx @pixid/cli alice --size 12 --scale 8                # 12×12 cells, 96×96 px
npx @pixid/cli alice --bgcolor '#ffffff' --color '#111' # fixed palette
```

The CLI's `--scale` defaults to `16`, not `4`. Every flag, the output filename
rules, and the error behavior: [`packages/cli`](./packages/cli/README.md).

## API

### `@pixid/core`

| Function                                       | Returns                   | Notes                                                         |
| ---------------------------------------------- | ------------------------- | ------------------------------------------------------------- |
| `createIcon(options?: IconOptions)`            | `IconData`                | Grid (`size * size` cells, each `0`, `1`, or `2`) and colors. |
| `toSvg(icon: IconData, scale?: number)`        | `string`                  | A complete `<svg>` document. `scale` defaults to `4`.         |
| `toSvgDataURL(icon: IconData, scale?: number)` | `string`                  | `data:image/svg+xml;charset=utf-8,` + `encodeURIComponent`.   |
| `toPng(icon: IconData, scale?: number)`        | `Uint8Array<ArrayBuffer>` | PNG file bytes. `scale` defaults to `4`.                      |
| `toPngDataURL(icon: IconData, scale?: number)` | `string`                  | `data:image/png;base64,` + the same bytes.                    |
| `iconRuns(icon: IconData)`                     | `CellRun[]`               | Horizontal runs of same-valued, non-background cells.         |
| `parseColor(input: ColorInput)`                | `RGB`                     | Normalizes a color. Throws `TypeError` on anything else.      |
| `rgbToCss(rgb: RGB)`                           | `string`                  | `'rgb(12,34,56)'`.                                            |

`toPng` writes an indexed-color PNG in zlib stored (uncompressed) blocks: no
compression library, synchronous, and identical bytes on every runtime. Its
return type goes straight into `new Response()` or `new Blob()`; reading it
needs TypeScript 5.7 or later, or `skipLibCheck`. Full reference, including the
types and the errors each function throws:
[`packages/core`](./packages/core/README.md).

### `@pixid/canvas`

`createCanvas(options?)` returns a new `<canvas>`, `renderToCanvas(canvas,
options?)` draws into an existing one, and `toCanvasDataURL(options?)` returns
a PNG data URL. They take the six [options](#options), including `scale`.
`toCanvasDataURL` uses the browser's PNG encoder, so its bytes differ between
browsers; use `toPng` when you need reproducible files. Full reference:
[`packages/canvas`](./packages/canvas/README.md).

### `@pixid/react`

`<Pixid />` takes the six [options](#options) as props, plus any
`SVGProps<SVGSVGElement>` (`className`, `style`, `role`, `aria-*`, ...), which
are spread onto the root `<svg>` after the computed attributes, so `width`,
`height`, and `viewBox` can be overridden. A `ref` reaches the `<svg>` on React
17, 18, and 19. Full reference: [`packages/react`](./packages/react/README.md).

### `@pixid/vue`

`<Pixid />` declares the six [options](#options) as props. Everything else,
such as `class`, `style`, `role`, `aria-*`, and listeners, falls through to the
root `<svg>`, and can override `width`, `height`, and `viewBox`. The markup is
byte for byte what `@pixid/react` renders. Full reference:
[`packages/vue`](./packages/vue/README.md).

### `@pixid/cli`

The `pixid` command is summarized in [CLI](#cli). The package also exports
`runCli(argv?)` and `version` for running the CLI from a script. Full reference:
[`packages/cli`](./packages/cli/README.md).

## Stability

pixid follows [semantic versioning](https://semver.org). Within 1.x, for the
same input:

- `createIcon` returns the same grid and the same colors.
- `toSvg`, `toSvgDataURL`, `toPng`, and `toPngDataURL` return the same bytes,
  and so do the files the CLI writes.

A change to any of these is a major release. The promise does not cover the
markup that `@pixid/react` and `@pixid/vue` render, beyond the grid and colors
it draws, or `toCanvasDataURL`, whose bytes come from the browser.

Changes are listed in each package's `CHANGELOG.md`, for example
[`packages/core/CHANGELOG.md`](./packages/core/CHANGELOG.md).

## Ethereum / blockies compatibility

The PRNG, draw order, color arithmetic, cell distribution, and mirroring rules
are identical to ethereum-blockies. `packages/core/src/core.test.ts` keeps a
direct port of the original code as an oracle and asserts grid-for-grid and
color-for-color equality, and it checks palettes against PNGs rendered by
ethereum-blockies-base64.

- **Grids** always match.
- **Colors** match ethereum-blockies-base64 and MetaMask Mobile's Blockies
  down to the RGB value. The original ethereum-blockies hands CSS `hsl()`
  strings to the browser, whose rounding can differ by one step on rare seeds
  (about 1 in 10,000 in Chromium). MetaMask's browser extension draws with
  `blo`, which drops the fractions of saturation and lightness, so its colors
  can differ by a few steps while hue and grid stay the same.
- **Seeds** are used exactly as given. MetaMask and ethereum-blockies-base64
  seed with `address.toLowerCase()`, so lowercase the address to match them. A
  checksummed address such as `0x8ba1f109551bD432803012645Ac136ddd64DBA72`
  is a different seed and gives a completely different icon.

### How a seed becomes an icon

`createIcon` seeds a xorshift PRNG from the seed string, then draws in a fixed
order:

1. `color`: 6 draws (a hue in whole degrees, saturation, and four lightness samples averaged into a bell curve)
2. `bgcolor`: 6 draws
3. `spotcolor`: 6 draws
4. the grid: `size * ceil(size / 2)` draws, one per cell of the left half

Each cell gets `Math.floor(rand() * 2.3)`: roughly 43% background, 43%
foreground, and 13% spot. The left half is mirrored onto the right; with an odd
`size` the middle column is drawn once.

An explicitly provided color skips its six draws, which shifts every later
draw. Passing `color` gives the background the palette entry the foreground
would have had, and a different grid:

```ts
import { createIcon } from '@pixid/core';

createIcon({ seed: 'alice' }).bgcolor; // [44, 38, 18]
createIcon({ seed: 'alice', color: '#ff0000' }).bgcolor; // [27, 12, 11]
```

To change only one color, replace it on the icon data instead:
`toSvg({ ...createIcon({ seed }), bgcolor: parseColor('#fff') })`.

This is the original ethereum-blockies behavior, kept so icons match for the
same inputs. An empty seed counts as omitted, as it does there: it would leave
the PRNG state all zero and the icon solid black.

## Size

Minified with esbuild (`bundle`, `minify`, `format: esm`), excluding the
`react` and `vue` peers:

| Import                                                   | Minified bundle |
| -------------------------------------------------------- | --------------- |
| `import { createIcon } from '@pixid/core'`               | 2.0 kB          |
| `import { createIcon, toSvg } from '@pixid/core'`        | 2.9 kB          |
| `import { createIcon, toPng } from '@pixid/core'`        | 3.9 kB          |
| `import { createIcon, toPng, toSvg } from '@pixid/core'` | 4.6 kB          |
| `import { createCanvas } from '@pixid/canvas'`           | 2.7 kB          |
| `import { Pixid } from '@pixid/react'`                   | 2.9 kB          |
| `import { Pixid } from '@pixid/vue'`                     | 3.1 kB          |

The figures are measurements, not limits. Each library package's
`src/bundle.test.ts` enforces a ceiling (3 KB for `createIcon` alone, 4 KB with
`toSvg`, 6 KB with `toPng`, 4 KB for canvas, React, and Vue) and checks that an
import leaves out the renderers it does not use: `createIcon` or `toSvg` alone
carries no PNG encoder.

## Contributing

Development setup, checks, and the release process are in
[AGENTS.md](./AGENTS.md).

## License

MIT
