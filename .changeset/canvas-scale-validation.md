---
'@pixid/canvas': patch
---

`renderToCanvas`, `createCanvas`, `toCanvasDataURL`, and `renderIconToCanvas`
now throw a `RangeError` unless `scale` is a positive integer, like
`@pixid/png`. A scale of `0`, a negative or fractional number, `NaN`, or
`Infinity` used to be applied to the canvas size as-is, giving an empty,
default-sized, or blurry canvas instead of an error. The check runs before the
canvas is resized, so a canvas you pass in is left untouched.
