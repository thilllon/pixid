import { assertIconData } from './guard.js';
import { iconRuns, rgbToCss, type IconData } from './icon.js';

/**
 * Renders icon data from `createIcon()` as an SVG string.
 *
 * `scale` is the pixels per cell used for the width/height attributes: any
 * finite positive number, fractions included. Defaults to 4.
 */
export const toSvg = (icon: IconData, scale = 4): string => {
  assertIconData(icon, 'toSvg');
  // Unlike the PNG and canvas renderers, a fractional scale is fine here:
  // width and height are SVG lengths, and the viewBox keeps cells exact.
  if (!Number.isFinite(scale) || scale <= 0) {
    throw new RangeError(`invalid scale: ${scale} (expected a finite positive number)`);
  }

  const px = icon.size * scale;
  const colors = [rgbToCss(icon.bgcolor), rgbToCss(icon.color), rgbToCss(icon.spotcolor)];

  const rects = iconRuns(icon)
    .map(
      (run) =>
        `<rect x="${run.x}" y="${run.y}" width="${run.width}" height="1" fill="${colors[run.value]}"/>`,
    )
    .join('');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" ` +
    `viewBox="0 0 ${icon.size} ${icon.size}" shape-rendering="crispEdges">` +
    `<rect width="${icon.size}" height="${icon.size}" fill="${colors[0]}"/>` +
    rects +
    `</svg>`
  );
};

/** Renders icon data from `createIcon()` as a `data:image/svg+xml` URL. */
export const toSvgDataURL = (icon: IconData, scale = 4): string => {
  assertIconData(icon, 'toSvgDataURL');
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(toSvg(icon, scale))}`;
};
