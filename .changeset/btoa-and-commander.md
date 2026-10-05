---
'@pixid/core': patch
'@pixid/cli': minor
---

`@pixid/core`: `toPngDataURL` encodes with the built-in `btoa`. The output is unchanged.

`@pixid/cli`: arguments are parsed by commander, bundled into the package, so nothing new is installed. Flags and written files are unchanged. What differs: the `--help` layout, the wording of parser errors (unknown flag, missing value), and a positional that starts with a dash and a digit, such as `-1`, is now a seed instead of an unknown flag.
