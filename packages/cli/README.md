# @pixid/cli

[![npm](https://img.shields.io/npm/v/%40pixid%2Fcli?logo=npm&label=npm)](https://www.npmjs.com/package/@pixid/cli)
[![license](https://img.shields.io/npm/l/%40pixid%2Fcli?color=blue)](https://github.com/thilllon/pixid/blob/main/LICENSE)

<img src="https://raw.githubusercontent.com/thilllon/pixid/main/assets/alice.png" width="64" height="64" alt="identicon for alice" />

Command-line blocky identicon generator. Writes deterministic PNG or SVG
identicons from any seed string.

**Requires:** Node.js 22 or later.

## Install

```sh
npx @pixid/cli alice   # run without installing: writes alice.png, 128×128
npm i -g @pixid/cli    # or put the `pixid` command on your PATH
```

There is no unscoped `pixid` package on npm; use `npx @pixid/cli`. A cold
`npx` downloads only `@pixid/cli` and `@pixid/core`.

## Usage

```sh
npx @pixid/cli                                          # random seed -> <uuid>.png
npx @pixid/cli alice --out avatars/alice.svg            # SVG, format inferred; creates avatars/
npx @pixid/cli alice -f svg --scale 32                  # alice.svg, 256×256
npx @pixid/cli alice --size 12 --scale 8                # 12×12 cells, 96×96 px
npx @pixid/cli alice --bgcolor '#ffffff' --color '#111' # fixed palette
```

## Flags

| Flag                                                    | Default                           | Description                                                                                   |
| ------------------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------- |
| `[seed]`, `-s`, `--seed <seed>`                         | random UUID                       | The seed. Positional or flag, not both; at most one positional. An empty seed counts as none. |
| `-o`, `--out <file>`                                    | `<sanitized-seed>.<format>`       | Output path, resolved against the current directory.                                          |
| `-f`, `--format <png\|svg>`                             | inferred from `--out`, else `png` | `--out` ending in `.svg` means SVG; anything else means PNG.                                  |
| `--size <n>`                                            | `8`                               | Cells per side, a positive integer.                                                           |
| `--scale <n>`                                           | `16`                              | Pixels per cell, a positive integer. The library uses `4`.                                    |
| `--color`, `--bgcolor`, `--spotcolor` `<#rgb\|#rrggbb>` | from seed                         | Foreground, background, and accent colors. Quote the `#`.                                     |
| `-h`, `--help` / `-v`, `--version`                      |                                   | Print usage or the version and exit 0. Unknown flags or missing values still fail.            |

## Programmatic API

`runCli(argv?: string[]): void` runs the command
(`argv` defaults to `process.argv.slice(2)`), and `version: string` is the
package version. Importing `@pixid/cli/run` runs `runCli()`; it is the `bin`
entry, in both ESM and CommonJS.

```ts
import { runCli, version } from '@pixid/cli';

console.log(version); // the installed @pixid/cli version
runCli(['--seed', 'alice', '-o', 'alice.png']); // writes the file, prints the path
```

## Notes

- **Filename.** Without `--out`, every seed character outside `[A-Za-z0-9._-]`
  becomes `_` and the name is cut to 100 characters: seed `a/b:c` writes
  `a_b_c.png`. Missing directories are created; existing files are overwritten.
  The cut affects only the filename, not the icon, so seeds that share their
  first 100 characters write to the same file; pass `--out` to keep them apart.
- **Output.** Success prints the absolute path and size, such as
  `/tmp/x/alice.png (4313 bytes)`.
- **Limits.** `--size × --scale` may be at most 4096 pixels per side.
- **Errors.** Invalid input or an unwritable file prints `pixid: <message>` and
  `Run "pixid --help" for usage.` to stderr and exits 1; nothing is written on invalid input. `runCli` calls
  `process.exit(1)` too, so use `toPng` and `toSvg` from `@pixid/core` when you
  want values back.

**More:** the [pixid README](https://github.com/thilllon/pixid#readme) covers every package, the shared options, and ethereum-blockies compatibility.

**Related:** [`@pixid/core`](https://www.npmjs.com/package/@pixid/core),
[`@pixid/canvas`](https://www.npmjs.com/package/@pixid/canvas),
[`@pixid/react`](https://www.npmjs.com/package/@pixid/react),
[`@pixid/vue`](https://www.npmjs.com/package/@pixid/vue).

## License

MIT
