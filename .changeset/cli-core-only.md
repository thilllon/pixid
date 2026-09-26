---
'@pixid/cli': patch
---

Depend on `@pixid/core` alone, which now renders SVG and PNG itself. A cold `npx @pixid/cli` downloads two packages instead of four. Output is unchanged.
