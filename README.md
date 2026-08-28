# pixid

[![@pixid/cli](https://img.shields.io/npm/v/%40pixid%2Fcli?logo=npm&label=%40pixid%2Fcli)](https://www.npmjs.com/package/@pixid/cli)
[![@pixid/core](https://img.shields.io/npm/v/%40pixid%2Fcore?logo=npm&label=%40pixid%2Fcore)](https://www.npmjs.com/package/@pixid/core)
[![@pixid/svg](https://img.shields.io/npm/v/%40pixid%2Fsvg?logo=npm&label=%40pixid%2Fsvg)](https://www.npmjs.com/package/@pixid/svg)
[![@pixid/png](https://img.shields.io/npm/v/%40pixid%2Fpng?logo=npm&label=%40pixid%2Fpng)](https://www.npmjs.com/package/@pixid/png)
[![downloads](https://img.shields.io/npm/d18m/%40pixid%2Fcore?logo=npm&label=downloads)](https://www.npmjs.com/package/@pixid/core)
[![CI](https://img.shields.io/github/actions/workflow/status/thilllon/pixid/ci.yml?branch=main&logo=githubactions&logoColor=white&label=CI)](https://github.com/thilllon/pixid/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/%40pixid%2Fcore?color=blue)](./LICENSE)

Deterministic blocky identicons from any seed string. Same grid and palette
algorithm as the original [ethereum-blockies](https://github.com/ethereum/blockies),
rewritten in TypeScript with zero runtime dependencies, split into small
packages so you only ship the renderer you actually use.

Everything is on npm under the `@pixid` scope:
[`@pixid/cli`](https://www.npmjs.com/package/@pixid/cli) for the command line,
[`@pixid/core`](https://www.npmjs.com/package/@pixid/core),
[`@pixid/svg`](https://www.npmjs.com/package/@pixid/svg),
[`@pixid/png`](https://www.npmjs.com/package/@pixid/png),
[`@pixid/canvas`](https://www.npmjs.com/package/@pixid/canvas), and
[`@pixid/react`](https://www.npmjs.com/package/@pixid/react) as libraries.

- [Quickstart](#quickstart)
- [Packages](#packages)
- [Size](#size)
- [How a seed becomes an icon](#how-a-seed-becomes-an-icon)
- [Options](#options)
- [Usage](#usage)
- [CLI](#cli)
- [API](#api)
- [Compatibility](#compatibility)
- [Development](#development)

## Packages

Every package name below links to its page on npm.

| Package                                                        | What it does                                                                                     | Runs in              | Tarball |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------- | ------- |
| [`@pixid/core`](https://www.npmjs.com/package/@pixid/core)     | Seed → pixel grid + color palette. Pure data, no rendering.                                      | everywhere           | 3.4 kB  |
| [`@pixid/svg`](https://www.npmjs.com/package/@pixid/svg)       | SVG string / `data:image/svg+xml` URL.                                                           | everywhere           | 2.1 kB  |
| [`@pixid/png`](https://www.npmjs.com/package/@pixid/png)       | PNG file bytes (`Uint8Array`) / `data:image/png` URL, with a built-in encoder.                   | Node, browsers, edge | 2.9 kB  |
| [`@pixid/canvas`](https://www.npmjs.com/package/@pixid/canvas) | Renders to an HTML `<canvas>`.                                                                   | browsers             | 3.4 kB  |
| [`@pixid/react`](https://www.npmjs.com/package/@pixid/react)   | `<Pixid />` component rendering inline SVG. Works in server components.                          | React 17+            | 2.4 kB  |
| [`@pixid/cli`](https://www.npmjs.com/package/@pixid/cli)       | The `pixid` command. Writes PNG or SVG files.                                                    | Node 18+             | 3.4 kB  |
| `pixid`                                                        | Meta package. Re-exports core + svg + png and ships the same CLI. Not on npm; name under review. | Node, browsers, edge | 4.0 kB  |

Tarball sizes are the gzipped published artifacts, measured with `pnpm pack`.

Every package is ESM + CJS, fully typed, and side-effect free. Nothing here
depends on `Buffer`, `fs`, `canvas`, or any npm package outside the `@pixid/*`
graph, so the same code runs in Node, browsers, and edge runtimes such as
Cloudflare Workers. Two documented exceptions: `@pixid/react` has `react >=17`
as a peer dependency, and `@pixid/cli` is a Node program that imports
`node:fs`, `node:path`, `node:crypto`, and `node:util` (its `sideEffects` is
`["./dist/cli.js"]` rather than `false`, because that file is meant to run on
import).

### Install note about the unscoped `pixid` name

`@pixid/cli` and the five other scoped packages are published. The unscoped
`pixid` package is not on npm yet: the registry rejects the name as too
similar to an existing package, and a review request is open with npm support.
Until that clears, use `@pixid/cli` for the command line and the scoped
packages (or `@pixid/core` + a renderer) as libraries. Everything documented
for `pixid` below works today from the workspace and will work from npm once
the name is released; the two CLI entry points run the exact same code.

## Size

Measured with esbuild (`bundle`, `minify`, `format: esm`), the same way
`e2e/treeshake.test.ts` enforces it:

| Import                                         | Minified bundle |
| ---------------------------------------------- | --------------- |
| `import { createIcon } from '@pixid/core'`     | 1.8 kB          |
| `import { toSvg } from '@pixid/svg'`           | 2.5 kB          |
| `import { toPng } from '@pixid/png'`           | 3.6 kB          |
| `import { createCanvas } from '@pixid/canvas'` | 2.4 kB          |
| `import { Pixid } from '@pixid/react'`         | 2.5 kB          |
| `import { createIcon } from 'pixid'`           | 1.8 kB          |
| `import { toSvg } from 'pixid'`                | 2.5 kB          |
| `import { toPng } from 'pixid'`                | 3.6 kB          |
| `import * as pixid from 'pixid'`               | 4.2 kB          |

The `@pixid/react` figure excludes `react` and `react/jsx-runtime`, which are
peer dependencies. Importing a single function from the `pixid` meta package
costs exactly as much as importing it from the scoped package it comes from,
because the meta package is a re-export with `sideEffects: false`.

A cold `npx @pixid/cli` downloads four tarballs totaling 11.8 kB. A cold
`npx pixid` downloads five (the meta package plus the same four), 15.9 kB.
Neither pulls in `@pixid/canvas` or `@pixid/react`; `e2e/registry.test.ts`
publishes everything to a local verdaccio registry and asserts it.

## How a seed becomes an icon

`createIcon` seeds a xorshift PRNG from the seed string, then makes draws in a
fixed order:

1. foreground `color` — 6 draws (hue, saturation, and four lightness samples averaged into a bell curve)
2. `bgcolor` — 6 draws
3. `spotcolor` — 6 draws
4. the grid — `size * ceil(size / 2)` draws, one per cell of the left half

Each grid cell gets `Math.floor(rand() * 2.3)`, so roughly 43% background, 43%
foreground, and 13% spot. The left half is mirrored onto the right, which is
what gives blockies their symmetry. With an odd `size` the middle column is
drawn once and not mirrored.

**Explicitly provided colors skip their PRNG draws.** This matters: it is not
just the one color that changes, it shifts every later draw. Passing `color`
makes the icon's background take the palette entry the foreground would have
had, and produces a completely different grid:

```ts
import { createIcon } from '@pixid/core';

createIcon({ seed: 'alice' }).bgcolor; // [44, 38, 18]
createIcon({ seed: 'alice', color: '#ff0000' }).bgcolor; // [27, 12, 11]
```

This is the original ethereum-blockies behavior, kept deliberately so icons
match classic blockies for the same inputs. If you want a fixed background
without disturbing the rest of the icon, render the grid yourself from
`createIcon(...)` and `iconRuns(...)`.

Everything else is pure: the same options always produce the same bytes, on
every runtime, with no global state. When `seed` is omitted, `createIcon`
generates a random 14-character hex string (the CLI generates a UUID instead)
and returns it on `IconData.seed`.

## Options

Every entry point except the low-level functions that take precomputed
`IconData` (`iconToSvg`, `iconToPng`, `renderIconToCanvas`) accepts the same
options object, and every field is optional:

| Option      | Type         | Default           | Description                                                    |
| ----------- | ------------ | ----------------- | -------------------------------------------------------------- |
| `seed`      | `string`     | random            | Same seed, same icon. Ethereum addresses work well.            |
| `size`      | `number`     | `8`               | Cells per side. Must be a positive integer.                    |
| `scale`     | `number`     | `4` (CLI: `16`)   | Pixels per cell. Rendered image is `size * scale` pixels wide. |
| `color`     | `ColorInput` | derived from seed | Foreground color (grid value `1`).                             |
| `bgcolor`   | `ColorInput` | derived from seed | Background color (grid value `0`).                             |
| `spotcolor` | `ColorInput` | derived from seed | Accent color (grid value `2`).                                 |

`scale` belongs to the renderers (`@pixid/svg`, `@pixid/png`, `@pixid/canvas`,
`@pixid/react`), not to `@pixid/core`, which is resolution-independent.

A `ColorInput` is either a hex string or an RGB tuple:

| Form        | Example         | Notes                                    |
| ----------- | --------------- | ---------------------------------------- |
| `#rgb`      | `'#f0a'`        | Case-insensitive, expanded to `#ff00aa`. |
| `#rrggbb`   | `'#ff00aa'`     | Case-insensitive.                        |
| `[r, g, b]` | `[255, 0, 170]` | Three integers in `0..255`.              |

Anything else throws a `TypeError` from `parseColor`. Named CSS colors,
`rgb()` strings, and alpha channels are not supported.

## Usage

### Node

```ts
import { writeFileSync } from 'node:fs';
import { toPng, toPngDataURL } from '@pixid/png';
import { toSvg } from '@pixid/svg';

writeFileSync('avatar.png', toPng({ seed: 'alice', scale: 16 })); // 128×128, 4313 bytes
writeFileSync('avatar.svg', toSvg({ seed: 'alice', scale: 16 }));

const url = toPngDataURL({ seed: 'alice', scale: 16 }); // data:image/png;base64,...
```

`toPng` returns a `Uint8Array`. `writeFileSync` accepts it directly; there is
no `Buffer` anywhere in the encoder. If you prefer a single import, the same
three functions are re-exported from `pixid`.

### Browser, no install

```html
<img id="avatar" width="128" height="128" />
<script type="module">
  import { toSvgDataURL } from 'https://esm.sh/@pixid/svg';
  document.getElementById('avatar').src = toSvgDataURL({ seed: 'alice', scale: 16 });
</script>
```

`pixid` and `@pixid/canvas` also ship IIFE builds for classic script tags,
exposing the globals `pixid` and `pixidCanvas`:

```html
<script src="https://cdn.jsdelivr.net/npm/pixid"></script>
<script>
  document.getElementById('avatar').src = pixid.toPngDataURL({ seed: 'alice', scale: 16 });
</script>
```

The IIFE bundle inlines its `@pixid/*` dependencies: 4.8 kB minified for
`pixid`, 2.6 kB for `@pixid/canvas`. `@pixid/core`, `@pixid/svg`, `@pixid/png`,
and `@pixid/react` are ESM/CJS only.

### Canvas

```ts
import { createCanvas, renderToCanvas, toCanvasDataURL } from '@pixid/canvas';

// New element, sized to size * scale and appended by you.
document.body.append(createCanvas({ seed: 'alice', scale: 8 }));

// Or draw into a canvas you already have. It is resized to fit.
const existing = document.querySelector('canvas')!;
renderToCanvas(existing, { seed: 'alice', scale: 8 });

// Or go straight to a PNG data URL produced by the browser's encoder.
document.querySelector('img')!.src = toCanvasDataURL({ seed: 'alice', scale: 8 });
```

These need a DOM. `createCanvas` and `toCanvasDataURL` call
`document.createElement('canvas')`; in Node, use `@pixid/png` instead.

### React

```tsx
import { Pixid } from '@pixid/react';

export const Avatar = ({ address }: { address: string }) => (
  <Pixid seed={address} scale={6} className="avatar" role="img" aria-label={address} />
);
```

The component renders inline SVG with no hooks, no effects, and no browser
APIs, so it works in React Server Components and during SSR without a
`"use client"` boundary:

```tsx
// app/page.tsx — a server component, no directive needed
import { Pixid } from '@pixid/react';

export default async function Page() {
  const user = await getUser();
  return <Pixid seed={user.id} scale={8} />;
}
```

Given a `seed`, the same props always produce the same markup, so server and
client renders match and hydration is clean. Omitting `seed` makes the
component non-deterministic and will cause a hydration mismatch.

### Edge runtimes

`@pixid/core`, `@pixid/svg`, and `@pixid/png` use only `Math`, typed arrays,
and `DataView`. No `Buffer`, no `fs`, no `zlib`, no dynamic `require`, no
Node built-ins at all:

```ts
import { toPng } from '@pixid/png';

export default {
  fetch(request: Request) {
    const seed = new URL(request.url).pathname.slice(1);
    return new Response(toPng({ seed, scale: 16 }), {
      headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=31536000' },
    });
  },
};
```

The PNG encoder is synchronous and allocation-light, so there is nothing to
await and no CPU-time surprise: a 128×128 icon is 4313 bytes.

## CLI

Two published entry points run the same program:

```
npx @pixid/cli [seed] [options]     # the CLI package
npx pixid      [seed] [options]     # the meta package, once the npm name clears
```

`@pixid/cli` contains the implementation and installs a `pixid` command
(`npm i -g @pixid/cli` gives you `pixid` on your `PATH`). The unscoped `pixid`
package depends on `@pixid/cli` and its `bin` is a two-line shim that imports
`@pixid/cli/run`, so both paths produce byte-identical output; the e2e suite
asserts that against a real registry.

### Flags

| Flag                   | Type              | Default                           | Description                                                         |
| ---------------------- | ----------------- | --------------------------------- | ------------------------------------------------------------------- |
| `[seed]`               | positional        | random UUID                       | The seed. Mutually exclusive with `--seed`. At most one is allowed. |
| `-s`, `--seed <seed>`  | string            | random UUID                       | The seed, as a flag.                                                |
| `-o`, `--out <file>`   | path              | `<sanitized-seed>.<format>`       | Output path, resolved against the current directory.                |
| `-f`, `--format <fmt>` | `png`\|`svg`      | inferred from `--out`, else `png` | Output format.                                                      |
| `--size <n>`           | integer ≥ 1       | `8`                               | Cells per side.                                                     |
| `--scale <n>`          | integer ≥ 1       | `16`                              | Pixels per cell. Note this differs from the library default of `4`. |
| `--color <color>`      | `#rgb`\|`#rrggbb` | from seed                         | Foreground color.                                                   |
| `--bgcolor <color>`    | `#rgb`\|`#rrggbb` | from seed                         | Background color.                                                   |
| `--spotcolor <color>`  | `#rgb`\|`#rrggbb` | from seed                         | Accent color.                                                       |
| `-h`, `--help`         | boolean           |                                   | Print usage and exit 0. Wins over every other flag.                 |
| `-v`, `--version`      | boolean           |                                   | Print the `@pixid/cli` version and exit 0.                          |

RGB tuples are library-only; on the command line colors must be hex strings.

### Behavior

**Seed.** Pass it positionally or with `--seed`, not both — doing both exits 1
with `pass the seed either as a positional argument or with --seed, not both`.
More than one positional argument is also an error. With no seed at all the
CLI generates a `crypto.randomUUID()` and names the file after it.

**Format inference.** If `--format` is given it wins. Otherwise, when `--out`
is given, the format is `svg` if the path ends in `.svg` (case-insensitive)
and `png` for every other extension — `-o icon.jpeg` writes PNG bytes to
`icon.jpeg`. With neither flag the format is `png`.

**Default filename.** Without `--out` the file is named after the seed with
every character outside `[A-Za-z0-9._-]` replaced by `_`, plus the format
extension. Seed `a/b:c` writes `a_b_c.png`. `--out` is used verbatim and is
resolved against `process.cwd()`.

**Output.** On success the absolute path and size go to stdout —
`/tmp/x/alice.png (4313 bytes)` — where the size is the PNG byte length, or
the SVG string length for `--format svg`. Existing files are overwritten.

**Errors.** Every invalid input writes `pixid: <message>` followed by
`Run "pixid --help" for usage.` to stderr and exits with code 1. That covers
unknown flags, unknown formats, non-positive-integer `--size`/`--scale`, and
malformed colors. Nothing is written to disk when an error occurs.

### Examples

```
npx @pixid/cli                                            # random seed -> <uuid>.png
npx @pixid/cli alice                                      # -> alice.png, 128×128
npx @pixid/cli --seed alice --out avatars/alice.svg       # -> SVG, format inferred
npx @pixid/cli alice -f svg --scale 32                    # -> alice.svg, 256×256
npx @pixid/cli alice --size 12 --scale 8                  # 12×12 cells, 96×96 px
npx @pixid/cli alice --bgcolor '#ffffff' --color '#111'   # fixed palette
npx @pixid/cli 0x8ba1f109551bd432803012645ac136ddd64dba72 # MetaMask-style avatar
```

Quote hex colors so your shell does not treat `#` as a comment.

## API

### `@pixid/core`

Types first, since every other package builds on them.

```ts
type RGB = readonly [number, number, number];
type ColorInput = RGB | string;

interface IconOptions {
  seed?: string;
  size?: number;
  color?: ColorInput;
  bgcolor?: ColorInput;
  spotcolor?: ColorInput;
}

interface IconData {
  seed: string; // the seed used, including a generated one
  size: number;
  grid: readonly number[]; // size * size entries, row-major, each 0 | 1 | 2
  color: RGB; // grid value 1
  bgcolor: RGB; // grid value 0
  spotcolor: RGB; // grid value 2
}

interface CellRun {
  x: number;
  y: number;
  width: number;
  value: number; // 1 = foreground, 2 = spot; background is never emitted
}
```

#### `createIcon(options?: IconOptions): IconData`

Computes the grid and palette for a seed. Throws `RangeError` if `size` is not
a positive integer, and `TypeError` if any color is malformed.

```ts
import { createIcon } from '@pixid/core';

const icon = createIcon({ seed: 'alice' });
icon.size; // 8
icon.grid.length; // 64
icon.grid.slice(0, 8); // [1, 0, 1, 2, 2, 1, 0, 1]
icon.color; // [27, 12, 11]
icon.bgcolor; // [44, 38, 18]
icon.spotcolor; // [198, 2, 10]

createIcon({ size: 5 }).grid.length; // 25
createIcon({}).seed; // e.g. '001c5f3778786a' — a generated seed, echoed back
```

#### `iconRuns(icon: IconData): CellRun[]`

Collapses the grid into horizontal runs of adjacent same-valued non-background
cells. The renderers use it to emit one shape per run instead of one per cell;
`createIcon({ seed: 'alice' })` has 64 cells and 29 runs.

```ts
import { createIcon, iconRuns } from '@pixid/core';

iconRuns(createIcon({ seed: 'alice' })).slice(0, 3);
// [ { x: 0, y: 0, width: 1, value: 1 },
//   { x: 2, y: 0, width: 1, value: 1 },
//   { x: 3, y: 0, width: 2, value: 2 } ]
```

Runs never cross a row boundary, and background cells (`0`) are skipped
entirely, which is why every renderer paints a full-size background rect first.

#### `parseColor(input: ColorInput): RGB`

Normalizes a `ColorInput` into an RGB tuple. Throws `TypeError` on anything
else, including out-of-range or non-integer tuple entries.

```ts
import { parseColor } from '@pixid/core';

parseColor('#f0a'); // [255, 0, 170]
parseColor('#FF00AA'); // [255, 0, 170]
parseColor([255, 0, 170]); // [255, 0, 170]
parseColor('red'); // TypeError: invalid color: "red" (expected #rgb or #rrggbb)
parseColor([300, 0, 0]); // TypeError: invalid color: [300,0,0]
```

#### `rgbToCss(rgb: RGB): string`

```ts
import { rgbToCss } from '@pixid/core';

rgbToCss([12, 34, 56]); // 'rgb(12,34,56)'
```

### `@pixid/svg`

`SvgOptions` is `IconOptions` plus `scale?: number` (default `4`).

| Function                                    | Returns  | Notes                                                       |
| ------------------------------------------- | -------- | ----------------------------------------------------------- |
| `toSvg(options?: SvgOptions)`               | `string` | Complete `<svg>` document.                                  |
| `toSvgDataURL(options?: SvgOptions)`        | `string` | `data:image/svg+xml;charset=utf-8,` + `encodeURIComponent`. |
| `iconToSvg(icon: IconData, scale?: number)` | `string` | Renders precomputed data. `scale` defaults to `4`.          |

The output has `width`/`height` in pixels, a `viewBox` in cell units, and
`shape-rendering="crispEdges"` so cells stay square at any display size:

```ts
import { toSvg, toSvgDataURL } from '@pixid/svg';

toSvg({ seed: 'alice', size: 2, scale: 4 });
// <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 2 2"
//   shape-rendering="crispEdges"><rect width="2" height="2" fill="rgb(44,38,18)"/>
//   <rect x="0" y="0" width="2" height="1" fill="rgb(27,12,11)"/></svg>

toSvg({ seed: 'alice' }).length; // 1934
toSvgDataURL({ seed: 'alice' }).slice(0, 33); // 'data:image/svg+xml;charset=utf-8,'
```

Use `iconToSvg` when you need the icon data too and do not want to run the
PRNG twice:

```ts
import { createIcon } from '@pixid/core';
import { iconToSvg } from '@pixid/svg';

const icon = createIcon({ seed: 'alice' });
const svg = iconToSvg(icon, 16);
const dominant = icon.color; // reuse the palette elsewhere
```

### `@pixid/png`

`PngOptions` is `IconOptions` plus `scale?: number` (default `4`).

| Function                                    | Returns      | Notes                                                       |
| ------------------------------------------- | ------------ | ----------------------------------------------------------- |
| `toPng(options?: PngOptions)`               | `Uint8Array` | Complete PNG file bytes.                                    |
| `toPngDataURL(options?: PngOptions)`        | `string`     | `data:image/png;base64,` + a dependency-free base64 encode. |
| `iconToPng(icon: IconData, scale?: number)` | `Uint8Array` | Throws `RangeError` unless `scale` is a positive integer.   |

```ts
import { toPng, toPngDataURL } from '@pixid/png';

toPng({ seed: 'alice' }).byteLength; // 377   (8×8 cells × scale 4 = 32×32 px)
toPng({ seed: 'alice', scale: 16 }).byteLength; // 4313  (128×128 px)
toPngDataURL({ seed: 'alice' }).slice(0, 21); // 'data:image/png;base64'
```

The encoder writes indexed-color PNGs: a three-entry `PLTE` palette and two
bits per pixel, wrapped in zlib _stored_ (uncompressed) deflate blocks with a
real Adler-32 and CRC-32. That is spec-valid everywhere, needs no compression
library, is synchronous, and produces identical bytes on every runtime — the
same seed gives the same file in Node, a browser, and a Worker.

### `@pixid/canvas`

`CanvasOptions` is `IconOptions` plus `scale?: number` (default `4`).

| Function                                                                | Returns         | Notes                                           |
| ----------------------------------------------------------------------- | --------------- | ----------------------------------------------- |
| `renderToCanvas(canvas: HTMLCanvasElement, options?: CanvasOptions)`    | the same canvas | Resizes the canvas to `size * scale` and draws. |
| `createCanvas(options?: CanvasOptions)`                                 | a new canvas    | Uses `document.createElement('canvas')`.        |
| `toCanvasDataURL(options?: CanvasOptions)`                              | `string`        | `createCanvas(...).toDataURL('image/png')`.     |
| `renderIconToCanvas(icon: IconData, canvas: HTMLCanvasElement, scale?)` | the same canvas | Precomputed data. `scale` defaults to `4`.      |

All four throw `Error: could not get a 2d context from the canvas` if
`getContext('2d')` returns `null`. Unlike `@pixid/png`, the bytes you get from
`toCanvasDataURL` come from the browser's PNG encoder, so they are not
byte-stable across browsers — use `@pixid/png` when you need reproducibility.

```ts
import { createIcon } from '@pixid/core';
import { renderIconToCanvas } from '@pixid/canvas';

const icon = createIcon({ seed: 'alice', size: 10 });
const canvas = document.querySelector('canvas');
renderIconToCanvas(icon, canvas, 12); // canvas is now 120×120
```

### `@pixid/react`

```tsx
import { Pixid, type PixidProps } from '@pixid/react';
```

| Prop        | Type                      | Default | Description                             |
| ----------- | ------------------------- | ------- | --------------------------------------- |
| `seed`      | `string`                  | random  | Same seed, same icon.                   |
| `size`      | `number`                  | `8`     | Cells per side.                         |
| `scale`     | `number`                  | `4`     | Pixels per cell; sets `width`/`height`. |
| `color`     | `ColorInput`              | seed    | Foreground color.                       |
| `bgcolor`   | `ColorInput`              | seed    | Background color.                       |
| `spotcolor` | `ColorInput`              | seed    | Accent color.                           |
| `...rest`   | `SVGProps<SVGSVGElement>` | —       | Spread onto the root `<svg>`.           |

`PixidProps` extends `Omit<SVGProps<SVGSVGElement>, 'color' | 'seed'>`, so
`className`, `style`, `onClick`, `role`, `aria-*`, `data-*`, and refs all work.
The two omitted names are re-typed as pixid options rather than SVG
attributes.

Passthrough props are spread _after_ the computed attributes, so you can
override `width`, `height`, or `viewBox` — useful for making the icon fill a
CSS-sized box:

```tsx
<Pixid seed="alice" width="100%" height="100%" />
```

The rendered markup is the same geometry and palette as `toSvg` with the same
options (`packages/react/src/react.test.tsx` cross-checks them rect by rect;
only React's attribute serialization differs). There is no `"use client"`
directive in the package and no `react-dom` dependency — just `react` as a
peer dependency at `>=17`.

```tsx
<Pixid seed="alice" size={2} scale={24} className="avatar" role="img" aria-label="alice" />
// <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 2 2"
//   shape-rendering="crispEdges" class="avatar" role="img" aria-label="alice">
//   <rect width="2" height="2" fill="rgb(44,38,18)"></rect>
//   <rect x="0" y="0" width="2" height="1" fill="rgb(27,12,11)"></rect></svg>
```

### `@pixid/cli`

Provides the `pixid` bin documented in [CLI](#cli), plus a small programmatic
surface:

| Export                            | Type                        | Description                                                          |
| --------------------------------- | --------------------------- | -------------------------------------------------------------------- |
| `runCli(argv?: string[])`         | `(argv?: string[]) => void` | Runs the CLI. `argv` defaults to `process.argv.slice(2)`.            |
| `version`                         | `string`                    | The `@pixid/cli` version, baked in at build time.                    |
| `@pixid/cli/run` (export subpath) | side-effecting module       | Importing it runs `runCli()`. This is also the file `bin` points at. |

`runCli` writes to stdout/stderr and calls `process.exit(1)` on invalid input,
so it is an entry point, not a library function — use `@pixid/png` and
`@pixid/svg` directly if you want values back.

```ts
import { runCli, version } from '@pixid/cli';

console.log(version); // e.g. '0.1.1'
runCli(['--seed', 'alice', '-o', 'alice.png']); // writes the file, prints the path
```

### `pixid`

The meta package. `export * from '@pixid/core'`, `'@pixid/svg'`, and
`'@pixid/png'`, so everything documented above for those three is available
from one import, tree-shaken to whatever you actually use:

```ts
import { createIcon, iconRuns, parseColor, rgbToCss } from 'pixid';
import { toSvg, toSvgDataURL, iconToSvg } from 'pixid';
import { toPng, toPngDataURL, iconToPng } from 'pixid';
import type { RGB, ColorInput, IconOptions, IconData, CellRun } from 'pixid';
```

It also ships the `pixid` bin (a shim over `@pixid/cli`) and the IIFE build
used by the jsdelivr script tag above. It deliberately does **not** re-export
`@pixid/canvas` or `@pixid/react`, which have DOM and React requirements.

## Compatibility

The PRNG (xorshift seeded from the string), the draw order (foreground,
background, spot color, then grid), the `Math.floor(rand() * 2.3)` cell
distribution, and the mirroring rules are identical to ethereum-blockies.
`packages/core/src/core.test.ts` keeps a direct port of the original code as
an independent oracle and asserts grid-for-grid equality, including the
draw-skipping behavior for explicit colors and locked regression vectors.
Icons for a given seed look the same as classic blockies, including the
MetaMask-style ones for Ethereum addresses.

This project supersedes
[`blockies-typed`](https://npmjs.com/package/blockies-typed), whose entire
public API was `createBuffer` and `createDataURL`:

| `blockies-typed`                | pixid                                    |
| ------------------------------- | ---------------------------------------- |
| `createBuffer(opts)` → `Buffer` | `toPng(opts)` → `Uint8Array`             |
| `createDataURL(opts)`           | `toPngDataURL(opts)`                     |
| `fgColor: [r, g, b]`            | `color: [r, g, b]` or `color: '#rrggbb'` |
| `bgColor` / `spotColor`         | `bgcolor` / `spotcolor`                  |
| `npx blockies-typed --seed x`   | `npx @pixid/cli --seed x`                |
| `commander` + `pngjs` deps      | no dependencies outside `@pixid/*`       |

Option names are lowercased, colors accept hex strings as well as tuples, and
`toPng` returns a `Uint8Array` instead of a Node `Buffer` (`writeFileSync`
takes both). `blockies-typed` also deviated from the original draw order, so
icons for the same seed differ between it and pixid. pixid follows the
original.

## Development

Node.js and pnpm versions are pinned in `mise.toml` (Node 24 LTS, pnpm 11).
With [mise](https://mise.jdx.dev) installed, `mise install` sets both up.

```
pnpm install
pnpm build        # tsdown, all packages
pnpm test         # unit tests
pnpm e2e          # tree-shaking checks + publish/npx flow against a local verdaccio registry
pnpm test:all     # both
pnpm lint         # eslint
pnpm format       # prettier --write
```

Every package is bundled by [tsdown](https://tsdown.dev) (Rolldown) from its
own `tsdown.config.ts`, targeting ES2022 with minification and bundled type
declarations. `@pixid/canvas` and `pixid` add a second, IIFE config that
inlines the `@pixid/*` graph into `dist/index.global.js`; `@pixid/cli` and
`pixid` add a Node-platform config for the shebang bin entry.

Layout: one folder per published package, named after what it contains.
`packages/cli` is `@pixid/cli`; `packages/pixid` is the unscoped `pixid` meta
package. The e2e suite in `e2e/` runs against real tooling — `e2e/treeshake.test.ts`
bundles with esbuild and asserts what gets dropped, and `e2e/registry.test.ts`
spins up verdaccio, publishes every package with `pnpm publish`, then runs
`npx` from a cold cache.

Releases are managed with [changesets](https://github.com/changesets/changesets):
`pnpm changeset` to record a change, merge the generated "Version Packages"
PR to publish. `pixid` and `@pixid/cli` are `linked` in
`.changeset/config.json`, so `pixid --version` and `@pixid/cli --version`
always report the same number.

## License

MIT
