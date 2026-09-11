---
'@pixid/core': minor
'@pixid/svg': minor
'@pixid/png': minor
'@pixid/canvas': minor
'@pixid/react': minor
'@pixid/cli': minor
---

Colors now match ethereum-blockies-base64 exactly, and with it MetaMask
Mobile's Blockies, which is a port of it. The hue is drawn in whole degrees, as
in the original ethereum-blockies. Before, it kept its fraction, so most seeds
got colors a few RGB steps off (up to 4 per channel): 29 of 3,507 test seeds
matched ethereum-blockies-base64 before, and all of them match now.

Grids are unchanged, but the colors, and so the rendered SVG, PNG, canvas, and
React output, change for almost every seed. Re-render any icons you stored or
cached if they must match what new versions produce.

The original ethereum-blockies lets the browser convert CSS `hsl()` strings,
which can round one step differently on rare seeds, and MetaMask's browser
extension uses `blo`, which drops the fractions of saturation and lightness, so
colors from those two can still differ slightly.
