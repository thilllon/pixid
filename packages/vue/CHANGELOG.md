# @pixid/vue

## 1.1.5

### Patch Changes

- a28f327: Remove the `thilllon` example icon and the Packages table from the README.
- Updated dependencies [a28f327]
  - @pixid/core@1.1.5

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

- Initial release, joining the rest of the packages at 0.2.0.

  `<Pixid />` renders a deterministic blocky identicon as inline SVG in Vue 3 —
  the same geometry and palette `@pixid/svg` produces for the same options. It is
  the Vue counterpart of `@pixid/react`: `seed`, `size`, `scale`, `color`,
  `bgcolor`, and `spotcolor` props, a `RangeError` for a `scale` that is not a
  finite positive number, and everything else falling through to the root
  `<svg>`.

  The component is written with `h()` rather than a single-file component, so the
  package ships plain JavaScript and needs no Vue compiler, and it uses no
  lifecycle hooks and no browser APIs, so it renders under
  `@vue/server-renderer` and in any Vue 3 runtime. `vue >=3.2.40` is a peer
  dependency — earlier `@vue/server-renderer` releases lowercased camelCase
  attribute names, which would serialize `viewBox` as `viewbox` and leave the
  icon a speck in the corner. The only runtime dependency is `@pixid/core`.
