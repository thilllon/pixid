# @pixid/canvas

<img src="https://raw.githubusercontent.com/thilllon/pixid/main/assets/alice.png" width="64" height="64" alt="identicon for alice" />

Draws deterministic blocky identicons onto an HTML `<canvas>` in the browser.

```sh
npm i @pixid/canvas
```

```ts
import { createCanvas, toCanvasDataURL } from '@pixid/canvas';

document.body.append(createCanvas({ seed: 'alice', scale: 8 })); // a new 64×64 <canvas>
document.querySelector('img')!.src = toCanvasDataURL({ seed: 'alice', scale: 8 });
```

Without a bundler, `<script src="https://cdn.jsdelivr.net/npm/@pixid/canvas"></script>`
defines the same functions on a global `pixidCanvas`. Full API:
[`@pixid/canvas` in the pixid README](https://github.com/thilllon/pixid#pixidcanvas).
