# pixid

[![@pixid/cli](https://img.shields.io/npm/v/%40pixid%2Fcli?logo=npm&label=%40pixid%2Fcli)](https://www.npmjs.com/package/@pixid/cli)
[![@pixid/core](https://img.shields.io/npm/v/%40pixid%2Fcore?logo=npm&label=%40pixid%2Fcore)](https://www.npmjs.com/package/@pixid/core)
[![@pixid/svg](https://img.shields.io/npm/v/%40pixid%2Fsvg?logo=npm&label=%40pixid%2Fsvg)](https://www.npmjs.com/package/@pixid/svg)
[![@pixid/png](https://img.shields.io/npm/v/%40pixid%2Fpng?logo=npm&label=%40pixid%2Fpng)](https://www.npmjs.com/package/@pixid/png)
[![downloads](https://img.shields.io/npm/d18m/%40pixid%2Fcore?logo=npm&label=downloads)](https://www.npmjs.com/package/@pixid/core)
[![CI](https://img.shields.io/github/actions/workflow/status/thilllon/pixid/ci.yml?branch=main&logo=githubactions&logoColor=white&label=CI)](https://github.com/thilllon/pixid/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/%40pixid%2Fcore?color=blue)](./LICENSE)

## Examples

Deterministic blocky identicons from any seed string. Eight seeds, eight icons —
128×128 PNGs straight out of `@pixid/png`, shown here at 72 px.

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

Reproduce any cell with one command, or the whole row with one script:

```
npx @pixid/cli 0xd8da6bf26964af9d7eed9e03e53415d37aa96045 --scale 16
pnpm assets   # regenerates assets/*.png from the fixed seeds in assets/generate.ts
```

Same grid and palette algorithm as the original
[ethereum-blockies](https://github.com/ethereum/blockies), rewritten in
TypeScript with zero runtime dependencies, split into small packages so you only
ship the renderer you actually use.

Everything is on npm under the `@pixid` scope:
[`@pixid/cli`](https://www.npmjs.com/package/@pixid/cli) for the command line,
[`@pixid/core`](https://www.npmjs.com/package/@pixid/core),
[`@pixid/svg`](https://www.npmjs.com/package/@pixid/svg),
[`@pixid/png`](https://www.npmjs.com/package/@pixid/png),
[`@pixid/canvas`](https://www.npmjs.com/package/@pixid/canvas),
[`@pixid/react`](https://www.npmjs.com/package/@pixid/react), and
[`@pixid/vue`](https://www.npmjs.com/package/@pixid/vue) as libraries.

- [Examples](#examples)
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

## Quickstart

Write a PNG for an Ethereum address, nothing installed:

```
npx @pixid/cli 0x8ba1f109551bd432803012645ac136ddd64dba72
# writes 0x8ba1f109551bd432803012645ac136ddd64dba72.png — 128×128 pixels, 4313 bytes
```

Seeds are case-sensitive. MetaMask and ethereum-blockies-base64 seed with
`address.toLowerCase()`, so lowercase Ethereum addresses too: a checksummed
(mixed-case) address gives a completely different icon (see
[Compatibility](#compatibility)).

In Node, a file or a data URL for an `<img>`:

```ts
import { writeFileSync } from 'node:fs';
import { toPng, toPngDataURL } from '@pixid/png';

const seed = '0x8ba1f109551bd432803012645ac136ddd64dba72';
writeFileSync('avatar.png', toPng({ seed, scale: 16 })); // 128×128, 4313 bytes
const src = toPngDataURL({ seed, scale: 16 }); // 'data:image/png;base64,...'
```

In React, inline SVG with no hooks, so it runs in server components too:

```tsx
import { Pixid } from '@pixid/react';

export const Avatar = ({ address }: { address: string }) => (
  <Pixid seed={address.toLowerCase()} scale={6} role="img" aria-label={address} />
);
```

In a browser, no build step:

```html
<img id="avatar" width="128" height="128" />
<script type="module">
  import { toSvgDataURL } from 'https://esm.sh/@pixid/svg';
  const seed = '0x8ba1f109551bd432803012645ac136ddd64dba72';
  document.getElementById('avatar').src = toSvgDataURL({ seed, scale: 16 });
</script>
```

Same seed, same bytes, on every runtime. Every flag is in [CLI](#cli), every
function in [API](#api), and the options they all share in [Options](#options).

## Packages

Every package name below links to its page on npm.

| Package                                                        | What it does                                                                   | Runs in              | Tarball |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------ | -------------------- | ------- |
| [`@pixid/core`](https://www.npmjs.com/package/@pixid/core)     | Seed → pixel grid + color palette. Pure data, no rendering.                    | everywhere           | 4.0 kB  |
| [`@pixid/svg`](https://www.npmjs.com/package/@pixid/svg)       | SVG string / `data:image/svg+xml` URL.                                         | everywhere           | 2.5 kB  |
| [`@pixid/png`](https://www.npmjs.com/package/@pixid/png)       | PNG file bytes (`Uint8Array`) / `data:image/png` URL, with a built-in encoder. | Node, browsers, edge | 3.3 kB  |
| [`@pixid/canvas`](https://www.npmjs.com/package/@pixid/canvas) | Renders to an HTML `<canvas>`.                                                 | browsers             | 3.9 kB  |
| [`@pixid/react`](https://www.npmjs.com/package/@pixid/react)   | `<Pixid />` component rendering inline SVG. Works in server components.        | React 17+            | 2.9 kB  |
| [`@pixid/vue`](https://www.npmjs.com/package/@pixid/vue)       | `<Pixid />` component rendering inline SVG. Works with SSR.                    | Vue 3.2.40+          | 3.3 kB  |
| [`@pixid/cli`](https://www.npmjs.com/package/@pixid/cli)       | The `pixid` command. Writes PNG or SVG files.                                  | Node 18.3+           | 4.1 kB  |

Tarball sizes are the gzipped published artifacts, measured with `pnpm pack`.

Every package is ESM + CJS, fully typed, and side-effect free. Nothing here
depends on `Buffer`, `fs`, `canvas`, or any npm package outside the `@pixid/*`
graph, so the same code runs in Node, browsers, and edge runtimes such as
Cloudflare Workers. Three documented exceptions: `@pixid/react` has `react >=17`
as a peer dependency, `@pixid/vue` has `vue >=3.2.40`, and `@pixid/cli` is a
Node program that imports `node:fs`, `node:path`, `node:crypto`, and
`node:util` (its `sideEffects` is `["./dist/cli.js"]` rather than `false`,
because that file is meant to run on import).

## Size

Measured with esbuild (`bundle`, `minify`, `format: esm`), the same way each
package's `src/bundle.test.ts` enforces its budget:

| Import                                         | Minified bundle |
| ---------------------------------------------- | --------------- |
| `import { createIcon } from '@pixid/core'`     | 2.1 kB          |
| `import { toSvg } from '@pixid/svg'`           | 2.8 kB          |
| `import { toPng } from '@pixid/png'`           | 3.8 kB          |
| `import { createCanvas } from '@pixid/canvas'` | 2.8 kB          |
| `import { Pixid } from '@pixid/react'`         | 2.9 kB          |
| `import { Pixid } from '@pixid/vue'`           | 3.1 kB          |

The `@pixid/react` and `@pixid/vue` figures exclude `react` and `vue`, which
are peer dependencies.

A cold `npx @pixid/cli` downloads four tarballs totaling 13.9 kB and does not
pull in `@pixid/canvas`, `@pixid/react`, or `@pixid/vue`;
`packages/cli/src/registry.e2e.test.ts` publishes everything to a local
verdaccio registry and asserts it.

## How a seed becomes an icon

`createIcon` seeds a xorshift PRNG from the seed string, then makes draws in a
fixed order:

1. foreground `color` — 6 draws (a hue in whole degrees, saturation, and four lightness samples averaged into a bell curve)
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
and returns it on `IconData.seed`. An empty string counts as omitted, as it
does in ethereum-blockies: it has no characters to seed the PRNG with, so the
state would stay all zero, every draw would be `0`, and the icon would come
out solid black.

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

`seed` is typed as a string, and `''` counts as omitted. JavaScript callers
may also pass a number or bigint, which is converted with `String()`, so `42`,
`42n`, and `'42'` give the same icon. A number above `Number.MAX_SAFE_INTEGER`
may already have lost precision, so pass ids that large as strings. `null`
counts as omitted too, and any other non-string `seed`, such as a boolean or an
object, throws a `TypeError`.

`scale` belongs to the renderers (`@pixid/svg`, `@pixid/png`, `@pixid/canvas`,
`@pixid/react`, `@pixid/vue`), not to `@pixid/core`, which is
resolution-independent. `@pixid/png` and `@pixid/canvas` require a positive
integer, since they fill whole pixels, and `@pixid/svg`, `@pixid/react`, and
`@pixid/vue` take any finite positive number. Each throws a `RangeError`
otherwise.

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
no `Buffer` anywhere in the encoder.

### Browser, no install

```html
<img id="avatar" width="128" height="128" />
<script type="module">
  import { toSvgDataURL } from 'https://esm.sh/@pixid/svg';
  document.getElementById('avatar').src = toSvgDataURL({ seed: 'alice', scale: 16 });
</script>
```

`@pixid/canvas` also ships an IIFE build for classic script tags, exposing the
global `pixidCanvas`:

```html
<script src="https://cdn.jsdelivr.net/npm/@pixid/canvas"></script>
<script>
  document.getElementById('avatar').src = pixidCanvas.toCanvasDataURL({ seed: 'alice', scale: 16 });
</script>
```

The IIFE bundle inlines its `@pixid/*` dependencies and is 2.9 kB minified.
`@pixid/core`, `@pixid/svg`, `@pixid/png`, `@pixid/react`, and `@pixid/vue` are
ESM/CJS only.

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
  <Pixid
    seed={address.toLowerCase()}
    scale={6}
    className="avatar"
    role="img"
    aria-label={address}
  />
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

One build covers React 17, 18, and 19: refs reach the `<svg>` element on all
three, and the package loads under Node ESM even with React 17. Details are
in [`@pixid/react`](#pixidreact).

### Vue

```vue
<script setup lang="ts">
import { Pixid } from '@pixid/vue';

const props = defineProps<{ address: string }>();
</script>

<template>
  <Pixid
    :seed="props.address.toLowerCase()"
    :scale="6"
    class="avatar"
    role="img"
    :aria-label="props.address"
  />
</template>
```

The component is written with Vue's `h()` render function, so the package ships
plain JavaScript and needs no Vue compiler — an app without a build step can
import it too. It uses no lifecycle hooks and no browser APIs, so it renders
under `@vue/server-renderer` as happily as in the browser:

```ts
import { Pixid } from '@pixid/vue';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp } from 'vue';

const markup = await renderToString(createSSRApp(Pixid, { seed: 'alice', scale: 8 }));
```

Given a `seed`, the same props always produce the same markup, so server and
client renders match and hydration is clean. Omitting `seed` makes the
component non-deterministic and will cause a hydration mismatch. Details are in
[`@pixid/vue`](#pixidvue).

### Edge runtimes

`@pixid/core`, `@pixid/svg`, and `@pixid/png` use only `Math`, typed arrays,
and `DataView`. No `Buffer`, no `fs`, no `zlib`, no dynamic `require`, no
Node built-ins at all:

```ts
import { toPng } from '@pixid/png';

export default {
  fetch(request: Request) {
    const seed = new URL(request.url).pathname.slice(1);
    const png = toPng({ seed, scale: 16 }) as Uint8Array<ArrayBuffer>;
    return new Response(png, {
      headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=31536000' },
    });
  },
};
```

The `as Uint8Array<ArrayBuffer>` is needed because `toPng` is typed as a plain
`Uint8Array`, which the DOM types in TypeScript 5.9 and later reject as a
`Response` body since it could be backed by a `SharedArrayBuffer`; `toPng`
always allocates a regular `ArrayBuffer`, so the assertion is safe.

The PNG encoder is synchronous and allocation-light, so there is nothing to
await and no CPU-time surprise: a 128×128 icon is 4313 bytes.

## CLI

```
npx @pixid/cli [seed] [options]
```

`@pixid/cli` installs a `pixid` command (`npm i -g @pixid/cli` gives you
`pixid` on your `PATH`). The command is named `pixid`, but the package is
always `@pixid/cli`: there is no unscoped `pixid` package on npm, so
`npx pixid` only works where `@pixid/cli` is already installed. Use
`npx @pixid/cli`.

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
| `-h`, `--help`         | boolean           |                                   | Print usage and exit 0. Unknown flags or missing values still fail. |
| `-v`, `--version`      | boolean           |                                   | Print the `@pixid/cli` version and exit 0.                          |

RGB tuples are library-only; on the command line colors must be hex strings.

### Behavior

**Seed.** Pass it positionally or with `--seed`, not both — doing both exits 1
with `pass the seed either as a positional argument or with --seed, not both`.
More than one positional argument is also an error. With no seed at all the
CLI generates a `crypto.randomUUID()` and names the file after it. An empty
seed (`--seed ''` or `''` as the positional) counts as no seed.

**Format inference.** If `--format` is given it wins. Otherwise, when `--out`
is given, the format is `svg` if the path ends in `.svg` (case-insensitive)
and `png` for every other extension — `-o icon.jpeg` writes PNG bytes to
`icon.jpeg`. With neither flag the format is `png`.

**Default filename.** Without `--out` the file is named after the seed with
every character outside `[A-Za-z0-9._-]` replaced by `_`, cut to its first
100 characters, plus the format extension. Seed `a/b:c` writes `a_b_c.png`.
The cut keeps names well under the 255-byte limit of common filesystems; it
only affects the filename, not the icon, so seeds that share their first 100
characters write to the same file. `--out` is used verbatim and is resolved
against `process.cwd()`.

**Output.** On success the absolute path and size go to stdout —
`/tmp/x/alice.png (4313 bytes)` — where the size is the PNG byte length, or
the SVG string length for `--format svg`. Missing parent directories are
created, so `--out avatars/alice.svg` works without an `avatars/` directory.
Existing files are overwritten.

**Errors.** Every invalid input writes `pixid: <message>` followed by
`Run "pixid --help" for usage.` to stderr and exits with code 1. That covers
unknown flags, unknown formats, non-positive-integer `--size`/`--scale`, and
malformed colors. Nothing is written to disk when an input error occurs. A
file that cannot be written — `--out` names an existing directory, a
permission is missing, a name is too long — is reported the same way with the
system's message, such as
`pixid: EISDIR: illegal operation on a directory, open '/tmp/x/avatars'`.

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
a positive integer, and `TypeError` if any color is malformed or `seed` is not
a string, number, or bigint. A number or bigint seed is converted with
`String()`; an omitted, `null`, or empty (`''`) seed is replaced by a random
one. Either way, `IconData.seed` is the string that was actually used.

```ts
import { createIcon } from '@pixid/core';

const icon = createIcon({ seed: 'alice' });
icon.size; // 8
icon.grid.length; // 64
icon.grid.slice(0, 8); // [1, 0, 1, 2, 2, 1, 0, 1]
icon.color; // [27, 12, 11]
icon.bgcolor; // [44, 38, 18]
icon.spotcolor; // [198, 2, 12]

createIcon({ size: 5 }).grid.length; // 25
createIcon({}).seed; // e.g. '001c5f3778786a' — a generated seed, echoed back
createIcon({ seed: '' }).seed; // e.g. '0b8e2d51f7a3c6' — '' counts as omitted
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

All three throw `RangeError` unless `scale` is a finite positive number, so
`0`, negative, `NaN`, and infinite scales never reach the `width` and `height`
attributes. Fractions are allowed, because those attributes are SVG lengths,
not a pixel buffer: `scale: 1.5` on the default 8×8 grid gives a 12×12 image
with the same `viewBox`.

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

All four throw `RangeError` unless `scale` is a positive integer, like
`@pixid/png`: canvas dimensions are whole pixels, so a fractional scale would
blur the cell edges. The check runs before the canvas is resized, so a canvas
you pass in is left as it was.

All four throw `Error: could not get a 2d context from the canvas` if
`getContext('2d')` returns `null`. Unlike `@pixid/png`, the bytes you get from
`toCanvasDataURL` come from the browser's PNG encoder, so they are not
byte-stable across browsers — use `@pixid/png` when you need reproducibility.

```ts
import { createIcon } from '@pixid/core';
import { renderIconToCanvas } from '@pixid/canvas';

const icon = createIcon({ seed: 'alice', size: 10 });
const canvas = document.querySelector('canvas')!;
renderIconToCanvas(icon, canvas, 12); // canvas is now 120×120
```

### `@pixid/react`

```tsx
import { Pixid, type PixidProps } from '@pixid/react';
```

| Prop        | Type                      | Default | Description                                                |
| ----------- | ------------------------- | ------- | ---------------------------------------------------------- |
| `seed`      | `string`                  | random  | Same seed, same icon.                                      |
| `size`      | `number`                  | `8`     | Cells per side.                                            |
| `scale`     | `number`                  | `4`     | Pixels per cell; sets `width`/`height`. Finite and > 0.    |
| `color`     | `ColorInput`              | seed    | Foreground color.                                          |
| `bgcolor`   | `ColorInput`              | seed    | Background color.                                          |
| `spotcolor` | `ColorInput`              | seed    | Accent color.                                              |
| `ref`       | `Ref<SVGSVGElement>`      | —       | Receives the root `<svg>` element on React 17, 18, and 19. |
| `...rest`   | `SVGProps<SVGSVGElement>` | —       | Spread onto the root `<svg>`.                              |

`PixidProps` extends `Omit<SVGProps<SVGSVGElement>, 'color' | 'seed'>`, so
`className`, `style`, `onClick`, `role`, `aria-*`, and `data-*` all work.
The two omitted names are re-typed as pixid options rather than SVG
attributes.

`Pixid` is a `forwardRef` component, which is what gets a `ref` to the `<svg>`
on React 17 and 18: they never pass `ref` to a plain function component.
`Pixid.displayName` is `'Pixid'`, so React DevTools and React's warnings name
it even though the build is minified.

`scale` must be a finite positive number; fractions are fine, since the output
is SVG. Anything else, such as `0`, `-1`, `NaN`, or `Infinity`, throws while
rendering: `RangeError: invalid scale: -1 (expected a finite positive number)`.
`size` and the colors are checked by `createIcon`, so they throw the errors
listed under [`@pixid/core`](#pixidcore).

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
peer dependency at `>=17`. The built files import only `react` and
`@pixid/core`: the elements are made with `createElement` rather than JSX,
because JSX compiles to imports of `react/jsx-runtime`, a subpath that Node's
ESM resolver cannot find in React 17, which has no exports map.

```tsx
<Pixid seed="alice" size={2} scale={24} className="avatar" role="img" aria-label="alice" />
// <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 2 2"
//   shape-rendering="crispEdges" class="avatar" role="img" aria-label="alice">
//   <rect width="2" height="2" fill="rgb(44,38,18)"></rect>
//   <rect x="0" y="0" width="2" height="1" fill="rgb(27,12,11)"></rect></svg>
```

### `@pixid/vue`

```ts
import { Pixid, type PixidProps } from '@pixid/vue';
```

| Prop        | Type         | Default | Description                                             |
| ----------- | ------------ | ------- | ------------------------------------------------------- |
| `seed`      | `string`     | random  | Same seed, same icon.                                   |
| `size`      | `number`     | `8`     | Cells per side.                                         |
| `scale`     | `number`     | `4`     | Pixels per cell; sets `width`/`height`. Finite and > 0. |
| `color`     | `ColorInput` | seed    | Foreground color.                                       |
| `bgcolor`   | `ColorInput` | seed    | Background color.                                       |
| `spotcolor` | `ColorInput` | seed    | Accent color.                                           |

Those six are the component's declared props; everything else a parent passes
is a fallthrough attribute, so `class`, `style`, `role`, `aria-*`, `data-*`,
and listeners all work. A template `ref` on `<Pixid>` gives the component
instance, whose `$el` is the root `<svg>` element.

`Pixid` is declared with `name: 'Pixid'`, so Vue DevTools and Vue's warnings
name it even though the build is minified.

`scale` must be a finite positive number; fractions are fine, since the output
is SVG. Anything else, such as `0`, `-1`, `NaN`, or `Infinity`, throws while
rendering: `RangeError: invalid scale: -1 (expected a finite positive number)`.
`size` and the colors are checked by `createIcon`, so they throw the errors
listed under [`@pixid/core`](#pixidcore).

Vue merges `$attrs` onto the root element _after_ the render function's own
attributes, so you can override `width`, `height`, or `viewBox` — useful for
making the icon fill a CSS-sized box:

```vue
<Pixid seed="alice" width="100%" height="100%" />
```

`class` and `style` are the exception Vue makes to that rule: it combines them
rather than replacing. The component sets neither, so there is nothing to
combine with and yours is what lands on the `<svg>`.

The rendered markup is the same geometry and palette as `toSvg` with the same
options (`packages/vue/src/vue.test.ts` cross-checks them rect by rect), and
byte for byte what `@pixid/react` renders. The component uses no lifecycle
hooks and no browser APIs, so `@vue/server-renderer` renders it on the server;
`vue >=3.2.40` is the only peer dependency, and the built files import nothing
but `vue` and `@pixid/core`. There is no single-file component and no JSX in
the package — the elements are made with `h()`, so the package ships plain
JavaScript and needs no Vue compiler.

The peer range starts at 3.2.40 rather than 3, because `@vue/server-renderer`
lowercased every camelCase attribute name before that release. SVG attribute
names are case-sensitive, so the `viewBox` this component emits would be
serialized as `viewbox`, the browser would ignore it, and the icon — drawn in
cell units — would render as a speck in the top-left corner of the `<svg>`.
Hydration does not repair it, and client-only rendering was never affected.

```vue
<Pixid seed="alice" :size="2" :scale="24" class="avatar" role="img" aria-label="alice" />
<!-- <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 2 2"
       shape-rendering="crispEdges" class="avatar" role="img" aria-label="alice">
       <rect width="2" height="2" fill="rgb(44,38,18)"></rect>
       <rect x="0" y="0" width="2" height="1" fill="rgb(27,12,11)"></rect></svg> -->
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

## Compatibility

The PRNG (xorshift seeded from the string), the draw order (foreground,
background, spot color, then grid), the color arithmetic (a whole-degree hue,
percentage saturation and lightness), the `Math.floor(rand() * 2.3)` cell
distribution, and the mirroring rules are identical to ethereum-blockies.
`packages/core/src/core.test.ts` keeps a direct port of the original code as
an independent oracle and asserts grid-for-grid and color-for-color equality,
including the draw-skipping behavior for explicit colors and locked regression
vectors, and it checks palettes against PNGs rendered by
ethereum-blockies-base64.

Grids always match. Colors match ethereum-blockies-base64, and MetaMask
Mobile's Blockies (a port of it), down to the RGB value. The original
ethereum-blockies hands CSS `hsl()` strings to the browser, whose rounding can
differ by one step on rare seeds (about 1 in 10,000 in Chromium). MetaMask's
browser extension draws Blockies with `blo`, which drops the fractions of
saturation and lightness, so its colors can differ by a few steps even though
the hue and the grid are the same.

To match any of them for an Ethereum address, seed with the lowercase address. MetaMask and
ethereum-blockies-base64 both seed with `address.toLowerCase()`, while pixid
uses the seed exactly as given. A checksummed (mixed-case) address is a
different seed: `0x8ba1f109551bD432803012645Ac136ddd64DBA72` and
`0x8ba1f109551bd432803012645ac136ddd64dba72` give completely different icons,
palette and grid alike.

pixid replaces `blockies-typed`, which lived in this same repository (formerly
`github.com/thilllon/blockies-typed`). Every `blockies-typed` version has been
unpublished from npm and this project no longer controls the name, so anything
published under it later is not from this project: remove it from your
`package.json` and lockfile, and do not run `npx blockies-typed`. Its last
source is tagged [`1.0.1`](https://github.com/thilllon/pixid/tree/1.0.1) in
this repository. Its entire public API was `createBuffer` and `createDataURL`:

| `blockies-typed` 1.0.1                    | pixid                                    |
| ----------------------------------------- | ---------------------------------------- |
| `createBuffer(opts)` → `Buffer`           | `toPng(opts)` → `Uint8Array`             |
| `createDataURL(opts)`                     | `toPngDataURL(opts)`                     |
| `fgColor: [r, g, b]`                      | `color: [r, g, b]` or `color: '#rrggbb'` |
| `bgColor` / `spotColor`                   | `bgcolor` / `spotcolor`                  |
| defaults `size: 7`, `scale: 24` (168×168) | defaults `size: 8`, `scale: 4` (32×32)   |
| `npx blockies-typed --seed x`             | `npx @pixid/cli --seed x`                |
| `-o`, `--output <file>`                   | `-o`, `--out <file>`                     |
| `commander` + `pngjs` deps                | no dependencies outside `@pixid/*`       |

Option names are lowercased, colors accept hex strings as well as tuples, and
`toPng` returns a `Uint8Array` instead of a Node `Buffer` (`writeFileSync`
takes both). `blockies-typed` also deviated from the original algorithm (one
random color shared by foreground and spot, a white background, and PRNG state
that leaked from one call into the next), so icons for the same seed differ
between it and pixid. pixid follows the original.

## Development

Node.js and pnpm versions are pinned in `mise.toml` (Node 24 LTS, pnpm 11).
With [mise](https://mise.jdx.dev) installed, `mise install` sets both up.

```
pnpm install
pnpm build        # tsdown, all packages
pnpm test         # unit tests, including per-package bundle-size checks
pnpm e2e          # publish/npx flow against a local verdaccio registry
pnpm test:all     # both
pnpm lint         # eslint
pnpm typecheck    # tsc --noEmit, root and every package (after pnpm build)
pnpm format       # prettier --write
pnpm format:check # prettier --check, as CI runs it
pnpm assets       # regenerate the README gallery in assets/
```

Every package is bundled by [tsdown](https://tsdown.dev) (Rolldown) from its
own `tsdown.config.ts`, targeting ES2022 with minification and bundled type
declarations. `@pixid/canvas` adds a second, IIFE config that inlines the
`@pixid/*` graph into `dist/index.global.js`; `@pixid/cli` adds a Node-platform
config for the shebang bin entry.

Layout: one folder per package under `packages/`, named after what it contains.
`packages/cli` is `@pixid/cli`. Tests are colocated with the code they cover,
in each package's `src/`.

Each library package's `src/bundle.test.ts` bundles the built package with
esbuild and enforces its budget from [Size](#size).
`packages/cli/src/registry.e2e.test.ts` spins up verdaccio, publishes every
package with `pnpm publish`, then runs `npx @pixid/cli` from a cold cache.
Files named `*.e2e.test.ts` make up the `e2e` vitest project that `pnpm e2e`
runs; everything else is a unit test.

The root `assets/` folder holds the gallery PNGs at the top of this file and
the `assets/generate.ts` script that produces them (`pnpm assets`). It sits
outside `packages/`, so no published tarball contains it.

Releases are managed with [changesets](https://github.com/changesets/changesets):
`pnpm changeset` to record a change, merge the generated "Version Packages"
PR to publish.

## License

MIT
