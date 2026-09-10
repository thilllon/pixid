---
'@pixid/svg': patch
---

`toSvg`, `toSvgDataURL`, and `iconToSvg` now throw a `RangeError` unless
`scale` is a finite positive number. A scale of `0`, a negative number, `NaN`,
or `Infinity` used to end up in the output as `width="0"`, `width="-32"`,
`width="NaN"`, or `width="Infinity"`. Fractional scales are still accepted,
since SVG width and height need not be whole pixels.
