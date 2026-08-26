import { createIcon, iconRuns, rgbToCss, type ColorInput } from '@pixid/core';
import type { SVGProps } from 'react';

export interface PixidProps extends Omit<SVGProps<SVGSVGElement>, 'color' | 'seed'> {
  /** Any string. The same seed always produces the same icon. */
  seed?: string;
  /** Number of cells per side. Defaults to 8. */
  size?: number;
  /** Pixels per cell used for the rendered width/height. Defaults to 4. */
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
 * Uses no hooks or browser APIs, so it works in React Server Components and
 * during server-side rendering without a `"use client"` boundary.
 */
export const Pixid = ({
  seed,
  size,
  scale = 4,
  color,
  bgcolor,
  spotcolor,
  ...rest
}: PixidProps) => {
  const icon = createIcon({ seed, size, color, bgcolor, spotcolor });
  const px = icon.size * scale;
  const colors = [rgbToCss(icon.bgcolor), rgbToCss(icon.color), rgbToCss(icon.spotcolor)];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={px}
      height={px}
      viewBox={`0 0 ${icon.size} ${icon.size}`}
      shapeRendering="crispEdges"
      {...rest}
    >
      <rect width={icon.size} height={icon.size} fill={colors[0]} />
      {iconRuns(icon).map((run) => (
        <rect
          key={`${run.x}-${run.y}`}
          x={run.x}
          y={run.y}
          width={run.width}
          height={1}
          fill={colors[run.value]}
        />
      ))}
    </svg>
  );
};
