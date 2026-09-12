# @pixid/vue

<img src="https://raw.githubusercontent.com/thilllon/pixid/main/assets/alice.png" width="64" height="64" alt="identicon for alice" />

A `<Pixid />` component that renders a deterministic blocky identicon as inline
SVG in Vue 3. It uses no lifecycle hooks and no browser APIs, so it renders on
the server too, and everything else you pass falls through to the root `<svg>`.

```sh
npm i @pixid/vue
```

```vue
<script setup lang="ts">
import { Pixid } from '@pixid/vue';

// Lowercase Ethereum addresses, as MetaMask does: seeds are case-sensitive.
const props = defineProps<{ address: string }>();
</script>

<template>
  <Pixid :seed="props.address.toLowerCase()" :scale="6" role="img" :aria-label="props.address" />
</template>
```

Props and details: [`@pixid/vue` in the pixid README](https://github.com/thilllon/pixid#pixidvue).
