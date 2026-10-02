# @pixid/react

[![npm](https://img.shields.io/npm/v/%40pixid%2Freact?logo=npm&label=npm)](https://www.npmjs.com/package/@pixid/react)
[![license](https://img.shields.io/npm/l/%40pixid%2Freact?color=blue)](https://github.com/thilllon/pixid/blob/main/LICENSE)

React component for pixid blocky identicons. Renders inline SVG, works in
server components, no client-side requirements.

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
  The same seed always gives the same icon. The second one is what <code>&lt;Pixid seed="alice" scale={16} /&gt;</code> renders.</sub>
</p>

**Requires:** `react >=17` as a peer dependency (one build covers 17, 18, and 19).
No `react-dom` dependency. Node.js 22 or later for server rendering.

## Install

```sh
npm i @pixid/react
```

## Usage

```tsx
import { Pixid } from '@pixid/react';

export const Avatar = ({ name }: { name: string }) => (
  <Pixid seed={name} scale={6} role="img" aria-label={name} />
);
```

## API

`<Pixid />` takes these props, typed as `PixidProps`:

| Prop        | Type                      | Default | Description                                                |
| ----------- | ------------------------- | ------- | ---------------------------------------------------------- |
| `seed`      | `string`                  | random  | Same seed, same icon.                                      |
| `size`      | `number`                  | `8`     | Cells per side.                                            |
| `scale`     | `number`                  | `4`     | Pixels per cell; sets `width`/`height`. Finite and > 0.    |
| `color`     | `ColorInput`              | seed    | Foreground color: `#rgb`, `#rrggbb`, or `[r, g, b]`.       |
| `bgcolor`   | `ColorInput`              | seed    | Background color.                                          |
| `spotcolor` | `ColorInput`              | seed    | Accent color.                                              |
| `ref`       | `Ref<SVGSVGElement>`      | —       | Receives the root `<svg>` element on React 17, 18, and 19. |
| `...rest`   | `SVGProps<SVGSVGElement>` | —       | `className`, `style`, `onClick`, `aria-*`, and so on.      |

## Notes

- **Server components.** No hooks, no effects, no browser APIs, and no
  `"use client"` directive, so it renders in React Server Components and
  during SSR. Given a `seed`, server and client markup match; without one the
  icon is random and hydration will not match.
- **Overrides.** Extra props are spread after the computed attributes, so
  `<Pixid seed="alice" width="100%" height="100%" />` fills a CSS-sized box.
- **Scale** may be fractional, since the output is SVG. `0`, negatives, `NaN`,
  and `Infinity` throw `RangeError` while rendering. `size` and colors are
  checked by `createIcon` from `@pixid/core`.
- **Markup.** The geometry and palette match `toSvg` from `@pixid/core` for the
  same options; the tests compare them rect by rect. The markup itself is not
  covered by the 1.x byte-stability promise.
- **React 17.** `Pixid` is a `forwardRef` component, so a `ref` reaches the
  `<svg>` on 17 and 18. Elements are built with `createElement`, not JSX,
  because React 17 has no exports map for `react/jsx-runtime` under Node.js ESM.

**More:** the [pixid README](https://github.com/thilllon/pixid#readme) covers every package, the shared options, and ethereum-blockies compatibility.

**Related:** [`@pixid/core`](https://www.npmjs.com/package/@pixid/core),
[`@pixid/vue`](https://www.npmjs.com/package/@pixid/vue),
[`@pixid/canvas`](https://www.npmjs.com/package/@pixid/canvas),
[`@pixid/cli`](https://www.npmjs.com/package/@pixid/cli).

## License

MIT
