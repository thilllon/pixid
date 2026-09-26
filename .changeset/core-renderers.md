---
'@pixid/core': patch
---

Add the SVG and PNG renderers that used to live in `@pixid/svg` and `@pixid/png`: `toSvg`, `toSvgDataURL`, `toPng` and `toPngDataURL`. Each takes the icon data from `createIcon()` and an optional scale, and produces exactly the bytes the old packages did:

```ts
import { createIcon, toPng, toSvg } from '@pixid/core';

const icon = createIcon({ seed: 'alice' });
toSvg(icon); // was toSvg({ seed: 'alice' }) from @pixid/svg
toPng(icon, 16); // was toPng({ seed: 'alice', scale: 16 }) from @pixid/png
```

`toSvgDataURL(options)` and `toPngDataURL(options)` become `toSvgDataURL(createIcon(options), scale)` and `toPngDataURL(createIcon(options), scale)`, and `iconToSvg` and `iconToPng` are the new `toSvg` and `toPng`. Passing options instead of icon data throws a `TypeError` that names the new form. `@pixid/svg` and `@pixid/png` are discontinued. A bundle that imports only `createIcon` does not grow, and one that uses only `toSvg` leaves the PNG encoder out; the input check adds under 0.1 kB to each renderer.
