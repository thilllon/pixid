---
'@pixid/react': patch
---

`<Pixid>` now keeps the promises of its `react >=17` peer range.

- Refs reach the root `<svg>` on React 17 and 18. The component is now a
  `forwardRef` component; before, those versions dropped the ref with a
  "Function components cannot be given refs" warning. React 19 already passed
  it through.
- `import { Pixid } from '@pixid/react'` works under Node ESM with React 17.
  The build used to import `react/jsx-runtime`, which Node cannot resolve in
  React 17 because it has no exports map, so the import failed with
  `ERR_MODULE_NOT_FOUND`. The component now calls `createElement` and imports
  nothing from React but `react` itself. React 19 logs no outdated-JSX-transform
  warning, and the rendered markup, SSR, and server components are unchanged.
- A `scale` that is not a finite positive number throws
  `RangeError: invalid scale: -1 (expected a finite positive number)` instead of
  rendering `width="-8"` or passing `NaN` and `Infinity` through.
- `Pixid.displayName` is `'Pixid'`, so DevTools and React's warnings no longer
  show the minified name (`a` or `n`).
- CommonJS consumers get the `.d.cts` declarations: the `exports` map nests
  `types` under `import` and `require`, and exports `./package.json`.
- Built with tsdown instead of tsup, with the same `dist` file layout, and the
  tarball now includes a README.
