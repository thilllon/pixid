# @pixid/canvas

[![npm](https://img.shields.io/npm/v/%40pixid%2Fcanvas?logo=npm&label=npm)](https://www.npmjs.com/package/@pixid/canvas)
[![license](https://img.shields.io/npm/l/%40pixid%2Fcanvas?color=blue)](https://github.com/thilllon/pixid/blob/main/LICENSE)

<img src="https://raw.githubusercontent.com/thilllon/pixid/main/assets/alice.png" width="64" height="64" alt="identicon for alice" />

Renders pixid blocky identicons to an HTML canvas element in the browser.

**Requires:** a DOM (`document.createElement('canvas')` and a 2D context) and
ES2022. The package declares Node.js 22 or later, but in Node.js use `toPng`
from [`@pixid/core`](https://www.npmjs.com/package/@pixid/core) instead.

## Install

```sh
npm i @pixid/canvas
```

Without a bundler, load the IIFE build (2.9 kB minified, `@pixid/core`
inlined). It defines the global `pixidCanvas`:

```html
<script src="https://cdn.jsdelivr.net/npm/@pixid/canvas@1"></script>
```

The same file is at `https://unpkg.com/@pixid/canvas@1`.

## Usage

```ts
import { createCanvas, renderToCanvas, toCanvasDataURL } from '@pixid/canvas';

document.body.append(createCanvas({ seed: 'alice', scale: 8 })); // a new 64×64 <canvas>
renderToCanvas(document.querySelector('canvas')!, { seed: 'alice', scale: 8 }); // resized to fit
document.querySelector('img')!.src = toCanvasDataURL({ seed: 'alice', scale: 8 });
```

## API

`CanvasOptions` is `IconOptions` from `@pixid/core` (`seed`, `size`, `color`,
`bgcolor`, `spotcolor`) plus `scale?: number`, pixels per cell, default `4`.

| Function                                                                | Returns         | Notes                                                         |
| ----------------------------------------------------------------------- | --------------- | ------------------------------------------------------------- |
| `renderToCanvas(canvas: HTMLCanvasElement, options?: CanvasOptions)`    | the same canvas | Resizes the canvas to `size * scale` and draws.               |
| `createCanvas(options?: CanvasOptions)`                                 | a new canvas    | Uses `document.createElement('canvas')`.                      |
| `toCanvasDataURL(options?: CanvasOptions)`                              | `string`        | `createCanvas(...).toDataURL('image/png')`.                   |
| `renderIconToCanvas(icon: IconData, canvas: HTMLCanvasElement, scale?)` | the same canvas | Draws precomputed `createIcon` data. `scale` defaults to `4`. |

## Notes

- **Scale** must be a positive integer: canvas dimensions are whole pixels.
  Anything else throws `RangeError` before the canvas is resized, so a canvas
  you pass in is left as it was.
- **No 2D context.** All four throw
  `Error: could not get a 2d context from the canvas` if `getContext('2d')`
  returns `null`.
- **Not byte-stable.** `toCanvasDataURL` uses the browser's PNG encoder, so
  its bytes differ between browsers. Use `toPng` from `@pixid/core` when you
  need reproducible files. The grid and colors drawn are the same everywhere.

**Docs:** [`@pixid/canvas` in the pixid README](https://github.com/thilllon/pixid#pixidcanvas).

**Related:** [`@pixid/core`](https://www.npmjs.com/package/@pixid/core),
[`@pixid/react`](https://www.npmjs.com/package/@pixid/react),
[`@pixid/vue`](https://www.npmjs.com/package/@pixid/vue),
[`@pixid/cli`](https://www.npmjs.com/package/@pixid/cli).

## License

MIT
