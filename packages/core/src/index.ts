export type RGB = readonly [number, number, number];

/** A color given as an RGB tuple or a hex string (`#rgb` or `#rrggbb`). */
export type ColorInput = RGB | string;

export interface IconOptions {
  /**
   * Any string. The same seed always produces the same icon. A random seed is
   * used when this is omitted or empty. A number or bigint from untyped code
   * is converted with `String()`; any other non-string throws a `TypeError`.
   */
  seed?: string;
  /** Number of cells per side. Defaults to 8. */
  size?: number;
  /** Foreground color. Derived from the seed when omitted. */
  color?: ColorInput;
  /** Background color. Derived from the seed when omitted. */
  bgcolor?: ColorInput;
  /** Accent color. Derived from the seed when omitted. */
  spotcolor?: ColorInput;
}

export interface IconData {
  /** The seed actually used: the given one as a string, or a generated one. */
  seed: string;
  size: number;
  /**
   * Row-major cell values, `size * size` entries.
   * 0 = background, 1 = foreground, 2 = spot.
   */
  grid: readonly number[];
  color: RGB;
  bgcolor: RGB;
  spotcolor: RGB;
}

/**
 * Xorshift PRNG seeded from a string, matching the algorithm used by the
 * original ethereum-blockies library. Instance-based so concurrent calls
 * never share state.
 */
class Xorshift {
  private readonly s: [number, number, number, number] = [0, 0, 0, 0];

  constructor(seed: string) {
    for (let i = 0; i < seed.length; i++) {
      const j = i % 4;
      const prev = this.s[j]!;
      this.s[j] = (prev << 5) - prev + seed.charCodeAt(i);
    }
  }

  /** Returns a float in [0, 1). */
  next(): number {
    const t = this.s[0] ^ (this.s[0] << 11);
    this.s[0] = this.s[1];
    this.s[1] = this.s[2];
    this.s[2] = this.s[3];
    this.s[3] = this.s[3] ^ (this.s[3] >> 19) ^ t ^ (t >> 8);
    return (this.s[3] >>> 0) / ((1 << 31) >>> 0);
  }
}

const hslToRgb = (h: number, s: number, l: number): RGB => {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }

  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
};

// Same arithmetic as the original ethereum/blockies (whole-degree hue,
// percentage saturation and lightness) and ethereum-blockies-base64. A
// fractional hue shifts channels by up to 4. Algebraically equivalent forms
// such as `rng.next() * 0.6 + 0.4` can round differently in floating point,
// so keep these expressions verbatim to stay bit-for-bit identical.
const createColor = (rng: Xorshift): RGB => {
  // Hue covers the whole spectrum, in whole degrees.
  const h = Math.floor(rng.next() * 360) / 360;
  // Saturation between 40% and 100% avoids greyish colors.
  const s = (rng.next() * 60 + 40) / 100;
  // Lightness follows a bell curve around 50%.
  const l = ((rng.next() + rng.next() + rng.next() + rng.next()) * 25) / 100;
  return hslToRgb(h, s, l);
};

const createGrid = (size: number, rng: Xorshift): number[] => {
  const dataWidth = Math.ceil(size / 2);
  const mirrorWidth = size - dataWidth;
  const grid: number[] = [];

  for (let y = 0; y < size; y++) {
    const row: number[] = [];
    for (let x = 0; x < dataWidth; x++) {
      // 43% chance each for background and foreground, 13% for the spot color.
      row.push(Math.floor(rng.next() * 2.3));
    }
    const mirrored = row.slice(0, mirrorWidth).reverse();
    grid.push(...row, ...mirrored);
  }

  return grid;
};

const HEX_SHORT = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i;
const HEX_LONG = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;

/** Normalizes a {@link ColorInput} into an RGB tuple. Throws on invalid input. */
export const parseColor = (input: ColorInput): RGB => {
  if (typeof input === 'string') {
    const short = HEX_SHORT.exec(input);
    if (short) {
      return [
        parseInt(short[1]! + short[1]!, 16),
        parseInt(short[2]! + short[2]!, 16),
        parseInt(short[3]! + short[3]!, 16),
      ];
    }
    const long = HEX_LONG.exec(input);
    if (long) {
      return [parseInt(long[1]!, 16), parseInt(long[2]!, 16), parseInt(long[3]!, 16)];
    }
    throw new TypeError(`invalid color: ${JSON.stringify(input)} (expected #rgb or #rrggbb)`);
  }

  if (
    Array.isArray(input) &&
    input.length === 3 &&
    input.every((v) => Number.isInteger(v) && v >= 0 && v <= 255)
  ) {
    return [input[0], input[1], input[2]];
  }

  throw new TypeError(`invalid color: ${JSON.stringify(input)}`);
};

/** Formats an RGB tuple as a CSS color, e.g. `rgb(12,34,56)`. */
export const rgbToCss = ([r, g, b]: RGB): string => `rgb(${r},${g},${b})`;

const randomSeed = (): string =>
  Math.floor(Math.random() * 10 ** 16)
    .toString(16)
    .padStart(14, '0');

/**
 * Normalizes `options.seed` into the string the PRNG reads. The PRNG only
 * consumes string characters, so a raw number or an empty string would leave
 * it unseeded and every such seed would draw the same all-black icon. Numbers
 * and bigints are converted instead; `null` and `''` count as omitted, as
 * `opts.seed || random` does in ethereum-blockies.
 */
const resolveSeed = (seed: unknown): string => {
  const type = typeof seed;
  if (seed == null || seed === '') return randomSeed();
  if (type === 'string' || type === 'number' || type === 'bigint') return String(seed);
  throw new TypeError(`invalid seed type: ${type} (expected a string, number, or bigint)`);
};

/** A horizontal run of adjacent same-colored non-background cells. */
export interface CellRun {
  x: number;
  y: number;
  width: number;
  /** 1 = foreground, 2 = spot. */
  value: number;
}

/**
 * Collapses the grid into horizontal runs of non-background cells.
 * Renderers use this to emit one shape per run instead of one per cell.
 */
export const iconRuns = (icon: IconData): CellRun[] => {
  const runs: CellRun[] = [];
  const { size, grid } = icon;

  for (let y = 0; y < size; y++) {
    let current: CellRun | undefined;
    for (let x = 0; x < size; x++) {
      const value = grid[y * size + x]!;
      if (current && value === current.value) {
        current.width += 1;
      } else {
        current = undefined;
        if (value !== 0) {
          current = { x, y, width: 1, value };
          runs.push(current);
        }
      }
    }
  }

  return runs;
};

/**
 * Computes the deterministic icon data (grid and palette) for a seed.
 *
 * The PRNG consumption order (foreground, background, spot color, then grid)
 * matches the original ethereum-blockies library, so icons are visually
 * identical to classic blockies for the same seed. Explicitly provided colors
 * skip their PRNG draws, also matching the original behavior.
 */
export const createIcon = (options: IconOptions = {}): IconData => {
  const seed = resolveSeed(options.seed);
  const size = options.size ?? 8;

  if (!Number.isInteger(size) || size < 1) {
    throw new RangeError(`invalid size: ${size} (expected a positive integer)`);
  }

  const rng = new Xorshift(seed);
  const color = options.color != null ? parseColor(options.color) : createColor(rng);
  const bgcolor = options.bgcolor != null ? parseColor(options.bgcolor) : createColor(rng);
  const spotcolor = options.spotcolor != null ? parseColor(options.spotcolor) : createColor(rng);
  const grid = createGrid(size, rng);

  return { seed, size, grid, color, bgcolor, spotcolor };
};
