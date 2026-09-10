# @pixid/svg

<img src="https://raw.githubusercontent.com/thilllon/pixid/main/assets/alice.png" width="64" height="64" alt="identicon for alice" />

Renders deterministic blocky identicons as SVG strings or `data:image/svg+xml`
URLs, in any JavaScript runtime.

```sh
npm i @pixid/svg
```

```ts
import { toSvg, toSvgDataURL } from '@pixid/svg';

const svg = toSvg({ seed: 'alice', scale: 16 }); // '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" ...'
const src = toSvgDataURL({ seed: 'alice', scale: 16 }); // 'data:image/svg+xml;charset=utf-8,...' for an <img>
```

Full API: [`@pixid/svg` in the pixid README](https://github.com/thilllon/pixid#pixidsvg).
