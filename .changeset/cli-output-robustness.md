---
'@pixid/cli': patch
---

Writing the output file no longer crashes with a stack trace:

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
