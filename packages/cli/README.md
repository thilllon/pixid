# @pixid/cli

<img src="https://raw.githubusercontent.com/thilllon/pixid/main/assets/alice.png" width="64" height="64" alt="identicon for alice" />

The `pixid` command: writes a deterministic blocky identicon for any seed
string as a PNG or SVG file. Needs Node 18.3+.

```sh
npm i -g @pixid/cli   # puts `pixid` on your PATH; or run it with npx, no install
```

```sh
npx @pixid/cli alice                                               # alice.png, the icon above (128×128)
npx @pixid/cli alice --out avatars/alice.svg                       # SVG, format inferred; creates avatars/
npx @pixid/cli 0x8ba1f109551bd432803012645ac136ddd64dba72 --scale 8 # 64×64 PNG
```

The package is always `@pixid/cli`: there is no unscoped `pixid` package on npm,
so `npx pixid` does not fetch this CLI.

Every flag and rule: [CLI in the pixid README](https://github.com/thilllon/pixid#cli).
