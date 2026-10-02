---
'@pixid/core': major
'@pixid/canvas': major
'@pixid/react': major
'@pixid/vue': major
'@pixid/cli': major
---

1.0.0: the first stable release. The API is unchanged from each package's latest 0.2.x release except for the two breaking changes below.

- Node.js 22 or later is required (`engines.node` is `>=22`). It was `>=18`, and `>=18.3.0` for `@pixid/cli`. Browser builds are unaffected: the published JavaScript still targets ES2022 and is the same code as in the latest 0.2.x releases, apart from the version string that `@pixid/cli` embeds.
- `toPng` in `@pixid/core` is typed as returning `Uint8Array<ArrayBuffer>` instead of `Uint8Array`. The bytes are the same. The result now goes straight into `new Blob([png])` or `new Response(png)` without an `as Uint8Array<ArrayBuffer>` cast, which the DOM types in TypeScript 5.9 and later required. Reading the new declaration needs TypeScript 5.7 or later; on older versions, enable `skipLibCheck`.

Within 1.x, the same input always produces the same output: `createIcon` returns the same grid and colors, and `toSvg`, `toSvgDataURL`, `toPng` and `toPngDataURL` return the same bytes. Changing any of them requires a new major version. The markup that the React and Vue components render is not covered by this promise.
