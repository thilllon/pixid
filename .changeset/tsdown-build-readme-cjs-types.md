---
'@pixid/core': patch
'@pixid/svg': patch
'@pixid/png': patch
'@pixid/canvas': patch
---

Rebuilt with tsdown instead of tsup. The API, and the output for any given
options, are unchanged.

- The CommonJS build is smaller: `dist/index.cjs` shrinks by 16–40% (for
  `@pixid/core`, from 2620 to 2166 bytes), and the `@pixid/canvas` IIFE build
  from 3036 to 2626 bytes. The ESM build, which bundlers use, stays within 1%
  of 0.1.1.
- The CommonJS entry no longer sets `__esModule`. `require()` returns the same
  named exports as before; only code that inspects the flag itself can tell,
  since none of these packages has a default export.
- TypeScript projects that compile to CommonJS now get CommonJS type
  declarations (`dist/index.d.cts`). 0.1.1 gave them the ESM declarations, so
  under `"module": "node16"` every import of these packages failed with TS1479.
- `<package>/package.json` is exported, so tools can resolve it.
- The npm page now shows a README with install instructions and an example.
