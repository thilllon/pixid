# @pixid/react

## 1.1.4

### Patch Changes

- 222189a: README: the License section is removed; the license badge and the `LICENSE` file remain.
- Updated dependencies [222189a]
  - @pixid/core@1.1.4

## 1.1.3

### Patch Changes

- fec5ff4: README: the package table lists core, cli, canvas, react, vue.
- Updated dependencies [fec5ff4]
  - @pixid/core@1.1.3

## 1.1.2

### Patch Changes

- d6fcffe: README: the package table no longer has an Install column.
- Updated dependencies [d6fcffe]
  - @pixid/core@1.1.2

## 1.1.1

### Patch Changes

- ac0600f: README: each package's npm page is now one short shared page that links to the pixid README on GitHub, where all documentation lives. The example icons have a caption that names their seeds.
- Updated dependencies [ac0600f]
  - @pixid/core@1.1.1

## 1.1.0

### Minor Changes

- a091fba: Documentation only; the published code is unchanged. Each package README now links to the top of the pixid README instead of a section that pointed back at it, the React and Vue examples use a plain seed, and the CLI README splits its flags from its programmatic API.

### Patch Changes

- Updated dependencies [a091fba]
  - @pixid/core@1.1.0

## 1.0.0

### Major Changes

- 11ee642: 1.0.0: the first stable release. The API is unchanged from each package's latest 0.2.x release except for the two breaking changes below.

  - Node.js 22 or later is required (`engines.node` is `>=22`). It was `>=18`, and `>=18.3.0` for `@pixid/cli`. Browser builds are unaffected: the published JavaScript still targets ES2022 and is the same code as in the latest 0.2.x releases, apart from the version string that `@pixid/cli` embeds.
  - `toPng` in `@pixid/core` is typed as returning `Uint8Array<ArrayBuffer>` instead of `Uint8Array`. The bytes are the same. The result now goes straight into `new Blob([png])` or `new Response(png)` without an `as Uint8Array<ArrayBuffer>` cast, which the DOM types in TypeScript 5.9 and later required. Reading the new declaration needs TypeScript 5.7 or later; on older versions, enable `skipLibCheck`.

  Within 1.x, the same input always produces the same output: `createIcon` returns the same grid and colors, and `toSvg`, `toSvgDataURL`, `toPng` and `toPngDataURL` return the same bytes. Changing any of them requires a new major version. The markup that the React and Vue components render is not covered by this promise.

### Patch Changes

- Updated dependencies [11ee642]
  - @pixid/core@1.0.0

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

- 9ce0959: `<Pixid>` now keeps the promises of its `react >=17` peer range.

  - Refs reach the root `<svg>` on React 17 and 18. The component is now a
    `forwardRef` component; before, those versions dropped the ref with a
    "Function components cannot be given refs" warning. React 19 already passed
    it through.
  - `import { Pixid } from '@pixid/react'` works under Node ESM with React 17.
    The build used to import `react/jsx-runtime`, which Node cannot resolve in
    React 17 because it has no exports map, so the import failed with
    `ERR_MODULE_NOT_FOUND`. The component now calls `createElement` and imports
    nothing from React but `react` itself. React 19 logs no outdated-JSX-transform
    warning, and switching away from JSX changes neither the rendered markup nor
    how SSR and server components work.
  - A `scale` that is not a finite positive number throws
    `RangeError: invalid scale: -1 (expected a finite positive number)` instead of
    rendering `width="-8"` or passing `NaN` and `Infinity` through.
  - `Pixid.displayName` is `'Pixid'`, so DevTools and React's warnings no longer
    show the minified name (`a` or `n`).
  - CommonJS consumers get the `.d.cts` declarations: the `exports` map nests
    `types` under `import` and `require`, and exports `./package.json`.
  - Built with tsdown instead of tsup, with the same `dist` file layout, and the
    tarball now includes a README.

- 67db275: Built with tsdown 0.23. The type declarations (`dist/index.d.ts` and
  `dist/index.d.cts`) now mark each declaration with an inline `export` instead of
  a trailing export list. The exported names and types are the same, and the
  JavaScript output is byte-identical.
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
