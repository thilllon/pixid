# @pixid/vue

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
