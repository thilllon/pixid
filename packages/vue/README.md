# @pixid/vue

[![npm](https://img.shields.io/npm/v/%40pixid%2Fvue?logo=npm&label=npm)](https://www.npmjs.com/package/@pixid/vue)
[![license](https://img.shields.io/npm/l/%40pixid%2Fvue?color=blue)](https://github.com/thilllon/pixid/blob/main/LICENSE)

Vue 3 component for pixid blocky identicons. Renders inline SVG, works with
SSR, no client-side requirements.

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
  The same seed always gives the same icon. The second one is what <code>&lt;Pixid seed="alice" :scale="16" /&gt;</code> renders.</sub>
</p>

**Requires:** `vue >=3.2.40` as a peer dependency. Node.js 22 or later for
server rendering. No Vue compiler: the package is plain JavaScript.

## Install

```sh
npm i @pixid/vue
```

## Usage

```vue
<script setup lang="ts">
import { Pixid } from '@pixid/vue';

defineProps<{ name: string }>();
</script>

<template>
  <Pixid :seed="name" :scale="6" role="img" :aria-label="name" />
</template>
```

## API

`<Pixid />` declares these props, typed as `PixidProps`:

| Prop        | Type         | Default | Description                                             |
| ----------- | ------------ | ------- | ------------------------------------------------------- |
| `seed`      | `string`     | random  | Same seed, same icon.                                   |
| `size`      | `number`     | `8`     | Cells per side.                                         |
| `scale`     | `number`     | `4`     | Pixels per cell; sets `width`/`height`. Finite and > 0. |
| `color`     | `ColorInput` | seed    | Foreground color: `#rgb`, `#rrggbb`, or `[r, g, b]`.    |
| `bgcolor`   | `ColorInput` | seed    | Background color.                                       |
| `spotcolor` | `ColorInput` | seed    | Accent color.                                           |

Everything else is a fallthrough attribute on the root `<svg>`: `class`,
`style`, `role`, `aria-*`, `data-*`, and listeners. A template `ref` gives the
component instance, whose `$el` is the `<svg>`.

## Notes

- **SSR.** No lifecycle hooks and no browser APIs, so `@vue/server-renderer`
  renders it. Given a `seed`, server and client markup match; without one the
  icon is random and hydration will not match.
- **Overrides.** Vue merges attributes after the render function's own, so
  `<Pixid seed="alice" width="100%" height="100%" />` fills a CSS-sized box.
  The component sets no `class` or `style`, so yours land unchanged.
- **Scale** may be fractional, since the output is SVG. `0`, negatives, `NaN`,
  and `Infinity` throw `RangeError` while rendering. `size` and colors are
  checked by `createIcon` from `@pixid/core`.
- **Markup** is byte for byte what `@pixid/react` renders, with the geometry
  and palette of `toSvg`. It is not covered by the 1.x byte-stability promise.
- **Why 3.2.40.** Earlier `@vue/server-renderer` releases lowercased
  camelCase attributes, so `viewBox` became `viewbox` and server-rendered icons
  shrank to a speck.

**More:** the [pixid README](https://github.com/thilllon/pixid#readme) covers every package, the shared options, and ethereum-blockies compatibility.

**Related:** [`@pixid/core`](https://www.npmjs.com/package/@pixid/core),
[`@pixid/react`](https://www.npmjs.com/package/@pixid/react),
[`@pixid/canvas`](https://www.npmjs.com/package/@pixid/canvas),
[`@pixid/cli`](https://www.npmjs.com/package/@pixid/cli).

## License

MIT
