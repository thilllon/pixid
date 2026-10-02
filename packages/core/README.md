# @pixid/core

[![npm](https://img.shields.io/npm/v/%40pixid%2Fcore?logo=npm&label=npm)](https://www.npmjs.com/package/@pixid/core)
[![license](https://img.shields.io/npm/l/%40pixid%2Fcore?color=blue)](https://github.com/thilllon/pixid/blob/main/LICENSE)

Blocky identicon generator. Turns a seed string into a deterministic pixel grid
and color palette, and renders it as SVG or PNG. Zero dependencies.

<p align="center">
  <img src="https://raw.githubusercontent.com/thilllon/pixid/main/assets/pixid.png" width="64" height="64" alt="identicon for the seed pixid" />
  &nbsp;
  <img src="https://raw.githubusercontent.com/thilllon/pixid/main/assets/alice.png" width="64" height="64" alt="identicon for the seed alice" />
  &nbsp;
  <img src="https://raw.githubusercontent.com/thilllon/pixid/main/assets/bob.png" width="64" height="64" alt="identicon for the seed bob" />
  &nbsp;
  <img src="https://raw.githubusercontent.com/thilllon/pixid/main/assets/thilllon.png" width="64" height="64" alt="identicon for the seed thilllon" />
</p>
<p align="center">
  <sub>Example output: the icons for the seeds <code>pixid</code>, <code>alice</code>, <code>bob</code>, and <code>thilllon</code>.<br />
  The same seed always gives the same icon. The second one is what <code>toPng(createIcon({ seed }), 16)</code> returns.</sub>
</p>

**Requires:** Node.js 22 or later, a browser with ES2022 support, or an edge
runtime such as Cloudflare Workers. No `Buffer`, `zlib`, or Node.js built-ins.

## Install

```sh
npm i @pixid/core
```

## Usage

```ts
import { createIcon, toPng, toPngDataURL, toSvg } from '@pixid/core';

const icon = createIcon({ seed: 'alice' }); // the icon above
icon.grid.slice(0, 8); // [1, 0, 1, 2, 2, 1, 0, 1]: 0 bgcolor, 1 color, 2 spotcolor
icon.color; // [27, 12, 11]

toSvg(icon, 16); // '<svg xmlns="http://www.w3.org/2000/svg" width="128" ...'
toPng(icon, 16); // Uint8Array<ArrayBuffer>, a 128×128 PNG file (4313 bytes)
toPngDataURL(icon); // 'data:image/png;base64,...', 32×32
```

One `createIcon` call feeds every renderer, and a bundle only carries the
renderers it imports.

## API

| Function                                       | Returns                   | Notes                                                        |
| ---------------------------------------------- | ------------------------- | ------------------------------------------------------------ |
| `createIcon(options?: IconOptions)`            | `IconData`                | Grid and palette for `seed`, `size`, and the three colors.   |
| `toSvg(icon: IconData, scale?: number)`        | `string`                  | A complete `<svg>` document. `scale` defaults to `4`.        |
| `toSvgDataURL(icon: IconData, scale?: number)` | `string`                  | `data:image/svg+xml;charset=utf-8,` + `encodeURIComponent`.  |
| `toPng(icon: IconData, scale?: number)`        | `Uint8Array<ArrayBuffer>` | PNG file bytes. `scale` defaults to `4`.                     |
| `toPngDataURL(icon: IconData, scale?: number)` | `string`                  | `data:image/png;base64,` + the same bytes.                   |
| `iconRuns(icon: IconData)`                     | `CellRun[]`               | Horizontal runs of same-valued, non-background cells.        |
| `parseColor(input: ColorInput)`                | `RGB`                     | `'#f0a'`, `'#ff00aa'`, or `[255, 0, 170]` → `[255, 0, 170]`. |
| `rgbToCss(rgb: RGB)`                           | `string`                  | `[12, 34, 56]` → `'rgb(12,34,56)'`.                          |

`iconRuns` never crosses a row boundary and never emits background (`0`) cells, so
a renderer built on it paints a full-size `bgcolor` rect first.

```ts
type RGB = readonly [number, number, number];
type ColorInput = RGB | string; // '#rgb', '#rrggbb', or [r, g, b] with integers in 0..255

interface IconOptions {
  seed?: string;
  size?: number; // cells per side, a positive integer; default 8
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

## Notes

- **Seed.** An omitted, `null`, or empty seed is replaced by a random one, and
  `IconData.seed` returns the seed that was used. A number or bigint is
  converted with `String()`; pass ids above `Number.MAX_SAFE_INTEGER` as
  strings, since a larger number may already have lost precision. Seeds are
  case-sensitive: lowercase Ethereum addresses to match MetaMask.
- **Explicit colors.** A color you pass skips its random draws, which shifts
  every later draw, so `createIcon({ seed, color })` also changes the other
  colors and the grid (this matches ethereum-blockies). To change only one
  color, replace it on the icon data:
  `toSvg({ ...createIcon({ seed }), bgcolor: parseColor('#fff') })`.
- **Errors.** `createIcon` throws `RangeError` for a `size` that is not a
  positive integer and `TypeError` for a malformed color or seed. The renderers
  throw `TypeError` unless `icon` is icon data (an object with a `grid` array,
  as `createIcon` returns).
- **Scale.** `toSvg` takes any finite positive number, such as `1.5`. `toPng`
  needs a positive integer, since a PNG is made of whole pixels. Anything else
  throws `RangeError`.
- **SVG.** `toSvg` sets `width` and `height` in pixels, a `viewBox` in cell
  units, and `shape-rendering="crispEdges"`, so cells stay square at any
  display size.
- **PNG.** An indexed-color PNG in zlib stored blocks, built synchronously with
  no compression library. The `Uint8Array<ArrayBuffer>` return type goes
  straight into `new Response()` or `new Blob()`; reading it needs TypeScript
  5.7 or later, or `skipLibCheck`.
- **Stability.** Within 1.x, the same input gives the same `createIcon` grid
  and colors and the same `toSvg`, `toSvgDataURL`, `toPng`, and `toPngDataURL`
  bytes.

**More:** the [pixid README](https://github.com/thilllon/pixid#readme) covers every package, the shared options, and ethereum-blockies compatibility.

**Related:** [`@pixid/canvas`](https://www.npmjs.com/package/@pixid/canvas),
[`@pixid/react`](https://www.npmjs.com/package/@pixid/react),
[`@pixid/vue`](https://www.npmjs.com/package/@pixid/vue),
[`@pixid/cli`](https://www.npmjs.com/package/@pixid/cli).

## License

MIT
