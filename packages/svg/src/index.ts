import { createIcon, iconRuns, rgbToCss, type IconData, type IconOptions } from '@pixid/core';

export interface SvgOptions extends IconOptions {
  /** Pixels per cell used for the width/height attributes. Defaults to 4. */
  scale?: number;
}

/** Renders precomputed icon data as an SVG string. */
export const iconToSvg = (icon: IconData, scale = 4): string => {
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

/** Generates an icon and renders it as an SVG string. */
export const toSvg = (options: SvgOptions = {}): string =>
  iconToSvg(createIcon(options), options.scale ?? 4);

/** Generates an icon and renders it as a `data:image/svg+xml` URL. */
export const toSvgDataURL = (options: SvgOptions = {}): string =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(toSvg(options))}`;
