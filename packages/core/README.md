# @pixid/core

<img src="https://raw.githubusercontent.com/thilllon/pixid/main/assets/alice.png" width="64" height="64" alt="identicon for alice" />

Turns any seed string into the pixel grid and color palette of a deterministic
blocky identicon: pure data, no rendering, zero dependencies.

```sh
npm i @pixid/core
```

```ts
import { createIcon, iconRuns } from '@pixid/core';

const icon = createIcon({ seed: 'alice' }); // the icon above
icon.grid.length; // 64: 8×8 cells, each 0 (bgcolor), 1 (color), or 2 (spotcolor)
icon.color; // [27, 12, 11]
iconRuns(icon).length; // 29 horizontal runs, one shape each when rendered
```

To draw icons, use [`@pixid/svg`](https://www.npmjs.com/package/@pixid/svg),
[`@pixid/png`](https://www.npmjs.com/package/@pixid/png),
[`@pixid/canvas`](https://www.npmjs.com/package/@pixid/canvas), or
[`@pixid/react`](https://www.npmjs.com/package/@pixid/react). Full API:
[`@pixid/core` in the pixid README](https://github.com/thilllon/pixid#pixidcore).
