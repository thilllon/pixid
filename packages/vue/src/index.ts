import { createIcon, iconRuns, rgbToCss, type ColorInput } from '@pixid/core';
import { defineComponent, h, type PropType } from 'vue';

export interface PixidProps {
  /** Any string. The same seed always produces the same icon. */
  seed?: string;
  /** Number of cells per side. Defaults to 8. */
  size?: number;
  /** Pixels per cell used for the rendered width/height. Defaults to 4. Must be finite and > 0. */
  scale?: number;
  /** Foreground color. Derived from the seed when omitted. */
  color?: ColorInput;
  /** Background color. Derived from the seed when omitted. */
  bgcolor?: ColorInput;
  /** Accent color. Derived from the seed when omitted. */
  spotcolor?: ColorInput;
}

/**
 * Blocky identicon rendered as inline SVG.
 *
 * Uses no lifecycle hooks and no browser APIs, so it renders on the server with
 * `@vue/server-renderer` and in any Vue 3 runtime.
 *
 * Everything the parent passes that is not one of the six props below is a
 * fallthrough attribute: Vue merges `$attrs` onto the root `<svg>` after the
 * computed attributes, so `class`, `style`, `role`, `aria-*`, `data-*`, and
 * listeners land there, and `width`, `height`, or `viewBox` can be overridden.
 */
export const Pixid = defineComponent({
  // The minifier renames everything, which would leave devtools and Vue's
  // warnings calling the component `a` or `n`.
  name: 'Pixid',
  // Vue needs the runtime declaration to keep these six names out of `$attrs`;
  // an undeclared prop would end up as an attribute on the `<svg>` instead. A
  // `ColorInput` is a hex string or an RGB tuple, hence the two constructors.
  props: {
    // `seed` is a string to TypeScript, but `createIcon` also takes a number or
    // a bigint from JavaScript callers and converts it with `String()`. The
    // runtime declaration lists all three so those callers do not get a
    // dev-mode prop warning for something every other entry point accepts; the
    // cast keeps the public type a string. Anything else still reaches
    // `createIcon`, which throws a `TypeError`.
    seed: { type: [String, Number, BigInt] as unknown as PropType<string> },
    size: { type: Number },
    scale: { type: Number, default: 4 },
    color: { type: [String, Array] as PropType<ColorInput> },
    bgcolor: { type: [String, Array] as PropType<ColorInput> },
    spotcolor: { type: [String, Array] as PropType<ColorInput> },
  },
  setup(props) {
    // A render function rather than a template or JSX, so the package needs no
    // Vue compiler and ships plain JavaScript. Rendering stays inside the
    // returned closure, which is what re-runs when a prop changes.
    return () => {
      const { seed, size, scale, color, bgcolor, spotcolor } = props;
      if (!Number.isFinite(scale) || scale <= 0) {
        throw new RangeError(`invalid scale: ${scale} (expected a finite positive number)`);
      }

      const icon = createIcon({ seed, size, color, bgcolor, spotcolor });
      const px = icon.size * scale;
      const colors = [rgbToCss(icon.bgcolor), rgbToCss(icon.color), rgbToCss(icon.spotcolor)];

      return h(
        'svg',
        {
          xmlns: 'http://www.w3.org/2000/svg',
          width: px,
          height: px,
          viewBox: `0 0 ${icon.size} ${icon.size}`,
          'shape-rendering': 'crispEdges',
        },
        [
          h('rect', { width: icon.size, height: icon.size, fill: colors[0] }),
          ...iconRuns(icon).map((run) =>
            h('rect', {
              key: `${run.x}-${run.y}`,
              x: run.x,
              y: run.y,
              width: run.width,
              height: 1,
              fill: colors[run.value],
            }),
          ),
        ],
      );
    };
  },
});
