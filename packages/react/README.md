# @pixid/react

A `<Pixid />` component that renders a deterministic blocky identicon as inline
SVG. It uses no hooks and no browser APIs, so it works in React Server
Components and during SSR, and a `ref` reaches the root `<svg>` on React 17, 18,
and 19.

```sh
npm install @pixid/react
```

```tsx
import { Pixid } from '@pixid/react';

// Lowercase Ethereum addresses, as MetaMask does: seeds are case-sensitive.
export const Avatar = ({ address }: { address: string }) => (
  <Pixid seed={address.toLowerCase()} scale={6} role="img" aria-label={address} />
);
```

Props and details: [`@pixid/react` in the pixid README](https://github.com/thilllon/pixid#pixidreact).
