---
'@pixid/core': patch
'@pixid/svg': patch
'@pixid/png': patch
'@pixid/canvas': patch
'@pixid/react': patch
'@pixid/cli': patch
---

Built with tsdown 0.23. The type declarations (`dist/index.d.ts` and
`dist/index.d.cts`) now mark each declaration with an inline `export` instead of
a trailing export list. The exported names and types are the same, and the
JavaScript output is byte-identical.
