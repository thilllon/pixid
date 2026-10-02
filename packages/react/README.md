# @pixid/react

[![npm](https://img.shields.io/npm/v/%40pixid%2Freact?logo=npm&label=npm)](https://www.npmjs.com/package/@pixid/react)
[![license](https://img.shields.io/npm/l/%40pixid%2Freact?color=blue)](https://github.com/thilllon/pixid/blob/main/LICENSE)

pixid generates deterministic blocky identicons from any seed string, compatible
with [ethereum-blockies](https://github.com/ethereum/blockies). It renders SVG,
PNG, and canvas, and comes with React and Vue components and a CLI.

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
  The same seed always gives the same icon: <code>npx @pixid/cli alice</code> writes the second one.</sub>
</p>

## Packages

| Package                                                        | What it does                                                  |
| -------------------------------------------------------------- | ------------------------------------------------------------- |
| [`@pixid/core`](https://www.npmjs.com/package/@pixid/core)     | Seed → pixel grid and palette, plus SVG and PNG renderers.    |
| [`@pixid/cli`](https://www.npmjs.com/package/@pixid/cli)       | The `pixid` command. Writes PNG or SVG files.                 |
| [`@pixid/canvas`](https://www.npmjs.com/package/@pixid/canvas) | Renders to an HTML `<canvas>`.                                |
| [`@pixid/react`](https://www.npmjs.com/package/@pixid/react)   | `<Pixid />` rendering inline SVG. Works in server components. |
| [`@pixid/vue`](https://www.npmjs.com/package/@pixid/vue)       | `<Pixid />` rendering inline SVG. Works with SSR.             |

## Documentation

Usage, options, and the full API for every package are in the
[pixid README](https://github.com/thilllon/pixid#pixidreact).

## License

MIT
