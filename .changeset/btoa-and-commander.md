---
'@pixid/core': patch
'@pixid/cli': minor
---

`@pixid/core`: `toPngDataURL` encodes with the built-in `btoa`. The output is unchanged.

`@pixid/cli`: arguments are parsed by commander, bundled into the package, so nothing new is installed. Flags and written files are unchanged; the `--help` layout and the wording of parser errors (unknown flag, missing value, extra argument) differ.
