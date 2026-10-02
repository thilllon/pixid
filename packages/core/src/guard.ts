import type { IconData } from './icon.js';

/**
 * Throws unless `icon` looks like the data `createIcon()` returns. Without
 * this, a call that passes options, such as `toSvg({ seed })`, fails deep
 * inside the renderer, or returns a broken image when every color is given.
 */
export const assertIconData: (icon: unknown, fn: string) => asserts icon is IconData = (
  icon,
  fn,
) => {
  if (!Array.isArray((icon as IconData | undefined)?.grid)) {
    throw new TypeError(`${fn}: expected icon data from createIcon()`);
  }
};
