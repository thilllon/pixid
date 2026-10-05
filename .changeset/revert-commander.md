---
'@pixid/cli': patch
---

Parse arguments with `node:util` `parseArgs` again, as in 1.1.5; commander is no longer bundled. `--help` output, parser error wording, and the rejection of `-1` are back to what they were.
