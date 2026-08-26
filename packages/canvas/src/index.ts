import { createIcon, iconRuns, rgbToCss, type IconData, type IconOptions } from '@pixid/core';

export interface CanvasOptions extends IconOptions {
  /** Pixels per cell. Defaults to 4. */
  scale?: number;
}

/** Renders precomputed icon data onto an existing canvas, resizing it to fit. */
export const renderIconToCanvas = (
  icon: IconData,
  canvas: HTMLCanvasElement,
  scale = 4,
): HTMLCanvasElement => {
  const px = icon.size * scale;
  canvas.width = px;
  canvas.height = px;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('could not get a 2d context from the canvas');
  }

  const colors = [rgbToCss(icon.bgcolor), rgbToCss(icon.color), rgbToCss(icon.spotcolor)];

  ctx.fillStyle = colors[0]!;
  ctx.fillRect(0, 0, px, px);

  for (const run of iconRuns(icon)) {
    ctx.fillStyle = colors[run.value]!;
    ctx.fillRect(run.x * scale, run.y * scale, run.width * scale, scale);
  }

  return canvas;
};

/** Generates an icon and renders it onto the given canvas. */
export const renderToCanvas = (
  canvas: HTMLCanvasElement,
  options: CanvasOptions = {},
): HTMLCanvasElement => renderIconToCanvas(createIcon(options), canvas, options.scale ?? 4);

/** Generates an icon and returns it as a new canvas element. */
export const createCanvas = (options: CanvasOptions = {}): HTMLCanvasElement =>
  renderToCanvas(document.createElement('canvas'), options);

/** Generates an icon and returns it as a PNG data URL produced by the canvas. */
export const toCanvasDataURL = (options: CanvasOptions = {}): string =>
  createCanvas(options).toDataURL('image/png');
