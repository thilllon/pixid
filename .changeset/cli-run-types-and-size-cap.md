---
'@pixid/cli': patch
---

- `@pixid/cli/run` now ships type declarations and a CommonJS build. It used
  to be a bare path to the ESM bin, so `require('@pixid/cli/run')` failed with
  `ERR_REQUIRE_ESM` and TypeScript found no types for it under any module
  resolution. `import` still resolves to the same file `bin` points at.
- The rendered image is capped at 4096 pixels per side, so `--size` times
  `--scale` may not exceed 4096. `pixid --scale 100000` now exits 1 with a
  message instead of spending minutes allocating a 640-billion-pixel image.
  The library functions are unchanged and still take any size.
