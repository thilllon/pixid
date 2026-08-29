# `@pixid/e2e`

Private workspace package (`"private": true`) holding the tests that cannot
belong to any single published package, because they exercise the whole
dependency graph:

| File                | What it does                                                                                                                                                                                                                                                                      |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `registry.test.ts`  | Boots a local [verdaccio](https://verdaccio.org) registry, `pnpm -r publish`es every publishable package to it, then runs `npx` from a cold cache for both CLI entry points and asserts byte-identical output, matching versions, which tarballs get downloaded, and their sizes. |
| `treeshake.test.ts` | Bundles the built packages with esbuild and asserts per-entry-point minified size budgets and which renderers get dropped.                                                                                                                                                        |

Run from the repository root:

```sh
pnpm e2e        # this package only
pnpm test:all   # unit tests + this package
```

Both suites read from `dist/`, so run `pnpm build` first.

`verdaccio` and `esbuild` are devDependencies here rather than in the root
manifest, so the tooling lives next to the only thing that uses it. Because the
package is private, `pnpm -r publish` skips it, which is what keeps
`registry.test.ts` from trying to publish the suite that does the publishing.
