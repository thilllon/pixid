# @pixid/cli

## 0.2.0

### Minor Changes

- 1e0301a: Colors now match ethereum-blockies-base64 exactly, and with it MetaMask
  Mobile's Blockies, which is a port of it. The hue is drawn in whole degrees, as
  in the original ethereum-blockies. Before, it kept its fraction, so most seeds
  got colors a few RGB steps off (up to 4 per channel): 29 of 3,507 test seeds
  matched ethereum-blockies-base64 before, and all of them match now.

  Grids are unchanged, but the colors, and so the rendered SVG, PNG, canvas, and
  React output, change for almost every seed. Re-render any icons you stored or
  cached if they must match what new versions produce.

  The original ethereum-blockies lets the browser convert CSS `hsl()` strings,
  which can round one step differently on rare seeds, and MetaMask's browser
  extension uses `blo`, which drops the fractions of saturation and lightness, so
  colors from those two can still differ slightly.

### Patch Changes

- 6565a18: `pixid --help` examples now use `npx @pixid/cli`. They used to show `npx pixid`,
  which fails unless `@pixid/cli` is already installed, because there is no
  unscoped `pixid` package on npm.
- 86993a5: Writing the output file no longer crashes with a stack trace:

  - `--out` creates missing parent directories, so
    `npx @pixid/cli alice --out avatars/alice.svg` works without an `avatars/`
    directory. It used to die with an uncaught `ENOENT`.
  - A file that cannot be written (`--out` names a directory, a permission is
    missing, a name is too long) is reported as `pixid: <message>` with exit
    code 1, the same way as invalid input.
  - An empty seed (`--seed ''` or `''` as the positional) counts as no seed: the
    CLI generates a UUID and names the file after it. It used to write the icon
    for `''` to a hidden file named `.png`.
  - The default filename keeps at most the first 100 characters of the sanitized
    seed, so long seeds no longer fail with `ENAMETOOLONG`. The icon still uses
    the whole seed, and an explicit `--out` is never shortened.

  `engines.node` is now `>=18.3.0`, the first Node 18 release with
  `util.parseArgs`, which the CLI needs.

  Also rebuilt with tsdown instead of tsup, with the same programmatic API
  (`runCli`, `version`, `@pixid/cli/run`). The CommonJS entry no longer sets
  `__esModule`, TypeScript projects that compile to CommonJS now get CommonJS
  type declarations (`dist/index.d.cts`) instead of the ESM ones, and the npm
  page now shows a README.

- 67db275: Built with tsdown 0.23. The type declarations (`dist/index.d.ts` and
  `dist/index.d.cts`) now mark each declaration with an inline `export` instead of
  a trailing export list. The exported names and types are the same, and the
  JavaScript output is byte-identical.
- Updated dependencies [1e0301a]
- Updated dependencies [08f10d4]
- Updated dependencies [67db275]
- Updated dependencies [86993a5]
  - @pixid/svg@0.2.0
  - @pixid/png@0.2.0

## 0.1.1

### Patch Changes

- Ship minified builds.

  The 0.1.0 tarballs for `@pixid/core`, `@pixid/svg`, `@pixid/png`,
  `@pixid/canvas`, and `@pixid/react` were published before `minify: true` was
  added to the tsup configs, so their `dist` output shipped unminified. This
  release republishes every package with minified ESM, CJS, and IIFE bundles. No
  API changes.

- Updated dependencies
  - @pixid/png@0.1.1
  - @pixid/svg@0.1.1
