# @pixid/png

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

- 67db275: Built with tsdown 0.23. The type declarations (`dist/index.d.ts` and
  `dist/index.d.cts`) now mark each declaration with an inline `export` instead of
  a trailing export list. The exported names and types are the same, and the
  JavaScript output is byte-identical.
- 86993a5: Rebuilt with tsdown instead of tsup. The rebuild itself changes neither the API
  nor the output for any given options.

  - The CommonJS build is smaller. Measured on the 0.1.1 source, `dist/index.cjs`
    shrinks by 16–40% (for `@pixid/core`, from 2620 to 2166 bytes), and the
    `@pixid/canvas` IIFE build from 3036 to 2626 bytes. The ESM build, which
    bundlers use, stays within 1%. The new validation code in this release adds
    a little back.
  - The CommonJS entry no longer sets `__esModule`. `require()` returns the same
    named exports as before; only code that inspects the flag itself can tell,
    since none of these packages has a default export.
  - TypeScript projects that compile to CommonJS now get CommonJS type
    declarations (`dist/index.d.cts`). 0.1.1 gave them the ESM declarations, so
    under `"module": "node16"` every import of these packages failed with TS1479.
  - `<package>/package.json` is exported, so tools can resolve it.
  - The npm page now shows a README with install instructions and an example.

- Updated dependencies [1e0301a]
- Updated dependencies [08f10d4]
- Updated dependencies [67db275]
- Updated dependencies [86993a5]
  - @pixid/core@0.2.0

## 0.1.1

### Patch Changes

- Ship minified builds.

  The 0.1.0 tarballs for `@pixid/core`, `@pixid/svg`, `@pixid/png`,
  `@pixid/canvas`, and `@pixid/react` were published before `minify: true` was
  added to the tsup configs, so their `dist` output shipped unminified. This
  release republishes every package with minified ESM, CJS, and IIFE bundles. No
  API changes.

- Updated dependencies
  - @pixid/core@0.1.1
