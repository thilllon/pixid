# @pixid/core

<img src="https://raw.githubusercontent.com/thilllon/pixid/main/assets/alice.png" width="64" height="64" alt="identicon for alice" />

Turns any seed string into the pixel grid and color palette of a deterministic
blocky identicon, and renders it as SVG or PNG with a built-in encoder. Zero
dependencies; runs in Node.js, browsers, and edge runtimes.

```sh
npm i @pixid/core
```

```ts
import { createIcon, iconRuns, toPng, toSvg } from '@pixid/core';

const icon = createIcon({ seed: 'alice' }); // the icon above
icon.grid.length; // 64: 8×8 cells, each 0 (bgcolor), 1 (color), or 2 (spotcolor)
icon.color; // [27, 12, 11]
iconRuns(icon).length; // 29 horizontal runs, one shape each when rendered

toSvg(icon, 16); // '<svg xmlns="http://www.w3.org/2000/svg" width="128" ...'
toPng(icon, 16); // Uint8Array, a 128×128 PNG file (4313 bytes)
```

`toSvgDataURL` and `toPngDataURL` return the same images as `data:` URLs. Each
renderer takes the icon plus an optional scale in pixels per cell (default
`4`), and a bundle only carries the renderers it imports.

`@pixid/svg` and `@pixid/png` are discontinued, and these are their renderers:
`toSvg({ seed, scale })` is now `toSvg(createIcon({ seed }), scale)`,
`iconToSvg(icon, scale)` is `toSvg(icon, scale)`, and the PNG functions change
the same way.

For a `<canvas>` or a component, use
[`@pixid/canvas`](https://www.npmjs.com/package/@pixid/canvas),
[`@pixid/react`](https://www.npmjs.com/package/@pixid/react), or
[`@pixid/vue`](https://www.npmjs.com/package/@pixid/vue). Full API:
[`@pixid/core` in the pixid README](https://github.com/thilllon/pixid#pixidcore).
