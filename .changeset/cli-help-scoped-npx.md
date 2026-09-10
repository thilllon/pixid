---
'@pixid/cli': patch
---

`pixid --help` examples now use `npx @pixid/cli`. They used to show `npx pixid`,
which fails unless `@pixid/cli` is already installed, because there is no
unscoped `pixid` package on npm.
