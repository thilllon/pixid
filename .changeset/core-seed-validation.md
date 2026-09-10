---
'@pixid/core': patch
---

`createIcon` no longer renders non-string and empty seeds as a solid black
icon:

- A number or bigint seed, such as a numeric user id passed from JavaScript, is
  converted with `String()`, so `seed: 42` gives the same icon as `seed: '42'`
  and `IconData.seed` is `'42'`. Every numeric seed used to produce the same
  all-black icon, with the number echoed back on `IconData.seed`.
- An empty seed (`''`) now counts as omitted, as it does in ethereum-blockies:
  `createIcon` generates a random seed and returns it on `IconData.seed`. It
  used to produce a solid black square.
- Any other non-string seed, such as a boolean or an object, throws a
  `TypeError`. `undefined` and `null` still mean no seed.

Icons for non-empty string seeds are unchanged. The renderers all call
`createIcon`, so this applies to `@pixid/svg`, `@pixid/png`, `@pixid/canvas`,
and `@pixid/react` too.
