import { createIcon, iconRuns, rgbToCss, type ColorInput } from '@pixid/core';
import { createElement, forwardRef, type SVGProps } from 'react';

export interface PixidProps extends Omit<SVGProps<SVGSVGElement>, 'color' | 'seed'> {
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
 * Blocky identicon rendered as inline SVG. A `ref` reaches the root `<svg>`.
 *
 * Uses no hooks or browser APIs, so it works in React Server Components and
 * during server-side rendering without a `"use client"` boundary.
 */
// forwardRef rather than a plain function component: React 17 and 18 never
// pass `ref` to a function component as a prop.
export const Pixid = forwardRef<SVGSVGElement, PixidProps>(
  ({ seed, size, scale = 4, color, bgcolor, spotcolor, ...rest }, ref) => {
    if (!Number.isFinite(scale) || scale <= 0) {
      throw new RangeError(`invalid scale: ${scale} (expected a finite positive number)`);
    }

    const icon = createIcon({ seed, size, color, bgcolor, spotcolor });
    const px = icon.size * scale;
    const colors = [rgbToCss(icon.bgcolor), rgbToCss(icon.color), rgbToCss(icon.spotcolor)];

    // createElement rather than JSX, so the build imports nothing from
    // `react/jsx-runtime`: React 17 has no exports map, and Node's ESM
    // resolver cannot find that subpath without one.
    return createElement(
      'svg',
      {
        xmlns: 'http://www.w3.org/2000/svg',
        width: px,
        height: px,
        viewBox: `0 0 ${icon.size} ${icon.size}`,
        shapeRendering: 'crispEdges',
        ...rest,
        ref,
      },
      createElement('rect', { width: icon.size, height: icon.size, fill: colors[0] }),
      iconRuns(icon).map((run) =>
        createElement('rect', {
          key: `${run.x}-${run.y}`,
          x: run.x,
          y: run.y,
          width: run.width,
          height: 1,
          fill: colors[run.value],
        }),
      ),
    );
  },
);

// The minifier renames the render function, which would leave DevTools and
// React's warnings calling the component `a` or `n`.
Pixid.displayName = 'Pixid';
