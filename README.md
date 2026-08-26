# blockies-typed

[![npm version](https://img.shields.io/npm/v/blockies-typed.svg)](https://www.npmjs.com/package/blockies-typed)
[![license](https://img.shields.io/npm/l/blockies-typed.svg)](./LICENSE)

A TypeScript implementation of [blockies](https://github.com/download13/blockies) — the blocky identicon generator best known for Ethereum wallet address avatars.

## Features

- **TypeScript first** — fully typed API, no `@types` package needed
- **CLI included** — generate `.png` files straight from the terminal
- **Node.js friendly** — returns a PNG `Buffer` or a base64 data URL, no canvas required
- **Minimal dependencies** — only `commander` (CLI) and `pngjs` (PNG encoding)

## Installation

```sh
npm install blockies-typed
# or
pnpm add blockies-typed
# or
yarn add blockies-typed
```

## Usage

### Library

```ts
import { createBuffer, createDataURL } from 'blockies-typed';

// PNG as a Buffer — write it to a file, send it as an HTTP response, etc.
const buffer = createBuffer({ seed: '0x8db97c7cece249c2b98bdc0226cc4c2a57bf52fc' });

// PNG as a data URL — drop it straight into an <img> tag.
const dataUrl = createDataURL({ seed: '0x8db97c7cece249c2b98bdc0226cc4c2a57bf52fc' });
// => 'data:image/png;base64,...'
```

Save an icon to disk:

```ts
import { writeFileSync } from 'fs';
import { createBuffer } from 'blockies-typed';

writeFileSync('icon.png', createBuffer({ seed: 'my-seed', size: 8, scale: 40 }));
```

Use it in HTML:

```ts
const img = document.createElement('img');
img.src = createDataURL({ seed: 'my-seed' });
document.body.appendChild(img);
```

### CLI

```sh
npx blockies-typed --output icon.png --seed this_is_my_seed
```

| Flag                    | Description                | Default       |
| ----------------------- | -------------------------- | ------------- |
| `-o, --output <output>` | Output file path           | `<uuid>.png`  |
| `-s, --seed <seed>`     | Seed for random generation | a random uuid |

### Options

All options are optional.

| Option      | Type                       | Default              | Description                                          |
| ----------- | -------------------------- | -------------------- | ---------------------------------------------------- |
| `seed`      | `string`                   | random hex string    | Seed used to initialize the pseudo-random generator  |
| `size`      | `number`                   | `7`                  | Number of blocks per row/column                      |
| `scale`     | `number`                   | `24`                 | Pixels per block (image is `size * scale` px square) |
| `fgColor`   | `[number, number, number]` | derived from seed    | Foreground color as an RGB tuple                     |
| `bgColor`   | `[number, number, number]` | `[255, 255, 255]`    | Background color as an RGB tuple                     |
| `spotColor` | `[number, number, number]` | derived from seed    | Spot (accent) color as an RGB tuple                  |

> **Note:** generation is deterministic — calling `createBuffer`/`createDataURL` with the same seed and options always produces the same image, so a wallet address (or user id) always maps to the same icon.

## API

### `createBuffer(options?: Options): Buffer`

Generates an identicon and returns it as a PNG-encoded `Buffer`.

### `createDataURL(options?: Options): string`

Generates an identicon and returns it as a base64 `data:image/png;base64,...` URL.

## Comparison with existing packages

| package                                                                       | Description                                                                                                                            | Provides                       | CLI Support | Type Support |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ----------- | ------------ |
| [`blockies-typed`](https://npmjs.org/package/blockies-typed)                  | This package                                                                                                                           | `createBuffer`, `createDataURL` | ✅          | ✅           |
| [`ethereum-blockies`](https://www.npmjs.com/package/ethereum-blockies)        | Used in the Ethereum Mist wallet                                                                                                       | `createIcon`, `render`         | ❌          | ❌           |
| [`ethereum-blockies-png`](https://www.npmjs.com/package/ethereum-blockies-png) | [Converts to PNG](https://github.com/petejkim/ethereum-blockies-png/blob/master/index.js)                                              | `createDataURL`, `createBuffer` | ❌          | ❌           |
| [`ethereum-blockies-base64`](https://www.npmjs.com/package/ethereum-blockies-base64) | [Base64 output](https://github.com/MyCryptoHQ/ethereum-blockies-base64/blob/master/src/main.js)                                  | `makeBlockie`                  | ❌          | ❌           |
| [`blockies`](https://www.npmjs.com/package/blockies)                          | Identical to `ethereum-blockies`                                                                                                       | `createIcon`                   | ❌          | ❌           |
| [`blockies-ts`](https://www.npmjs.com/package/blockies-ts)                    | [TypeScript version of `blockies`](https://github.com/pedrouid/blockies-ts/blob/bda2f2c124a3ab404dcf5077ac7a3545548edfb1/src/index.ts) | `create`                       | ❌          | ✅           |
| [`react-blockies`](https://www.npmjs.com/package/react-blockies)              | [React component of `blockies`](https://github.com/stephensprinkle-zz/react-blockies/blob/master/src/main.jsx)                         | `<Blockies />`                 | ❌          | ❌           |

## Development

```sh
pnpm install
pnpm test     # run jest tests (writes sample HTML previews to .test_output/)
pnpm build    # bundle with tsup
pnpm lint     # eslint --fix
```

## Reference

- [Use `'data:image/png;base64,' + buf.toString('base64')`](https://github.com/download13/blockies/blob/master/src/blockies.mjs)
- [Make the package zero dependency without use of `pngjs`, `pnglib`](https://github.com/GeorgeChan/pnglib/blob/master/lib/pnglib.js)

## License

[MIT](./LICENSE) © [thilllon](https://github.com/thilllon)
