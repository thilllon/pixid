# @pixid/png

<img src="https://raw.githubusercontent.com/thilllon/pixid/main/assets/alice.png" width="64" height="64" alt="identicon for alice" />

Encodes deterministic blocky identicons as PNG bytes or `data:image/png` URLs
with a built-in encoder: no `Buffer`, no zlib, nothing outside `@pixid/core`,
so it runs in Node, browsers, and edge runtimes alike.

```sh
npm i @pixid/png
```

```ts
import { writeFileSync } from 'node:fs';
import { toPng, toPngDataURL } from '@pixid/png';

writeFileSync('alice.png', toPng({ seed: 'alice', scale: 16 })); // the icon above: 128×128, 4313 bytes
const src = toPngDataURL({ seed: 'alice', scale: 16 }); // 'data:image/png;base64,...'
```

Full API: [`@pixid/png` in the pixid README](https://github.com/thilllon/pixid#pixidpng).
