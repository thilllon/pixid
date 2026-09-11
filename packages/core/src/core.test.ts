import { describe, expect, it } from 'vitest';
import { createIcon, iconRuns, parseColor, rgbToCss } from './index.js';

/**
 * Direct port of the original ethereum-blockies PRNG, color, and grid code
 * (https://github.com/ethereum/blockies, MIT). Used as an independent oracle
 * to verify that the rewritten, instance-based implementation consumes the
 * PRNG in exactly the same order and produces identical grids and colors.
 */
const oracle = (() => {
  const randseed = new Array<number>(4);

  const seedrand = (seed: string) => {
    randseed.fill(0);
    for (let i = 0; i < seed.length; i++) {
      randseed[i % 4] = (randseed[i % 4]! << 5) - randseed[i % 4]! + seed.charCodeAt(i);
    }
  };

  const rand = () => {
    const t = randseed[0]! ^ (randseed[0]! << 11);
    randseed[0] = randseed[1]!;
    randseed[1] = randseed[2]!;
    randseed[2] = randseed[3]!;
    randseed[3] = randseed[3]! ^ (randseed[3]! >> 19) ^ t ^ (t >> 8);
    return (randseed[3]! >>> 0) / ((1 << 31) >>> 0);
  };

  // The original's color draws, verbatim: a whole-degree hue and percentage
  // saturation and lightness. The original formats them into a CSS hsl()
  // string for the browser; see oracleRgb below for the conversion.
  const createColor = (): Hsl => {
    const h = Math.floor(rand() * 360);
    const s = rand() * 60 + 40;
    const l = (rand() + rand() + rand() + rand()) * 25;
    return [h, s, l];
  };

  const createImageData = (size: number) => {
    const width = size;
    const height = size;
    const dataWidth = Math.ceil(width / 2);
    const mirrorWidth = width - dataWidth;
    const data: number[] = [];
    for (let y = 0; y < height; y++) {
      let row: number[] = [];
      for (let x = 0; x < dataWidth; x++) {
        row[x] = Math.floor(rand() * 2.3);
      }
      const r = row.slice(0, mirrorWidth);
      r.reverse();
      row = row.concat(r);
      for (let i = 0; i < row.length; i++) {
        data.push(row[i]!);
      }
    }
    return data;
  };

  return (seed: string, size: number) => {
    seedrand(seed);
    // The original draws the three colors before the grid.
    const color = createColor();
    const bgcolor = createColor();
    const spotcolor = createColor();
    return { color, bgcolor, spotcolor, grid: createImageData(size) };
  };
})();

/** Hue in degrees, saturation and lightness in percent, as the original draws them. */
type Hsl = [number, number, number];

/**
 * Converts the oracle's HSL to RGB the way ethereum-blockies-base64 does:
 * scale to 0..1, then the standard HSL formula with Math.round per channel.
 * The original leaves this step to the browser's CSS hsl() parser instead.
 */
const oracleRgb = ([h, s, l]: Hsl): number[] => {
  const hue = h / 360;
  const sat = s / 100;
  const light = l / 100;
  if (sat === 0) return [light, light, light].map((v) => Math.round(v * 255));
  const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat;
  const p = 2 * light - q;
  const channel = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [channel(hue + 1 / 3), channel(hue), channel(hue - 1 / 3)].map((v) => Math.round(v * 255));
};

describe('createIcon', () => {
  it('is deterministic for the same seed', () => {
    const a = createIcon({ seed: 'determinism' });
    const b = createIcon({ seed: 'determinism' });
    expect(a).toEqual(b);
  });

  it('produces the same grids and colors as the original ethereum-blockies algorithm', () => {
    // No '' here: the original replaces a falsy seed with a random one
    // (`opts.seed || random`) before seeding, so it never runs the PRNG on an
    // empty string. pixid does the same; see the empty-seed test below.
    const seeds = [
      'a',
      'pixid',
      '0x8ba1f109551bd432803012645ac136ddd64dba72',
      '0x0000000000000000000000000000000000000000',
      '한글시드',
      'emoji 🙂 seed',
      ...Array.from({ length: 50 }, (_, i) => `fuzz-seed-${i * 7919}`),
    ];
    for (const seed of seeds) {
      for (const size of [5, 8, 15]) {
        const icon = createIcon({ seed, size });
        const expected = oracle(seed, size);
        expect(icon.grid, `seed=${seed} size=${size}`).toEqual(expected.grid);
        expect([icon.color, icon.bgcolor, icon.spotcolor], `seed=${seed}`).toEqual([
          oracleRgb(expected.color),
          oracleRgb(expected.bgcolor),
          oracleRgb(expected.spotcolor),
        ]);
      }
    }
  });

  it('produces the same palettes as ethereum-blockies-base64', () => {
    // [bgcolor, color, spotcolor], read from the PLTE chunk of the PNGs that
    // ethereum-blockies-base64 1.0.2 (the MetaMask-style implementation)
    // renders for these seeds. It lowercases its input, so the seeds are
    // lowercase already.
    const reference: [string, [number, number, number][]][] = [
      [
        '0x8ba1f109551bd432803012645ac136ddd64dba72',
        [
          [181, 1, 151],
          [165, 95, 38],
          [221, 76, 13],
        ],
      ],
      [
        'pixid',
        [
          [120, 71, 167],
          [107, 47, 46],
          [148, 71, 166],
        ],
      ],
      [
        'alice',
        [
          [44, 38, 18],
          [27, 12, 11],
          [198, 2, 12],
        ],
      ],
      [
        'thilllon',
        [
          [54, 157, 45],
          [115, 50, 49],
          [72, 107, 175],
        ],
      ],
      [
        '한글시드',
        [
          [112, 193, 25],
          [137, 81, 56],
          [89, 177, 57],
        ],
      ],
    ];
    for (const [seed, palette] of reference) {
      const icon = createIcon({ seed });
      expect([icon.bgcolor, icon.color, icon.spotcolor], seed).toEqual(palette);
    }
  });

  it('matches locked regression vectors', () => {
    const a = createIcon({ seed: 'pixid' });
    expect(a.color).toEqual([107, 47, 46]);
    expect(a.bgcolor).toEqual([120, 71, 167]);
    expect(a.spotcolor).toEqual([148, 71, 166]);
    expect(a.grid).toEqual([
      1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 2, 0, 1, 2, 2, 1, 0, 2, 0, 1, 2, 1, 1, 2, 1,
      0, 0, 1, 0, 2, 2, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 0, 2, 2, 1, 1, 2,
      2, 0,
    ]);

    const b = createIcon({ seed: '0x8ba1f109551bd432803012645ac136ddd64dba72', size: 5 });
    expect(b.color).toEqual([165, 95, 38]);
    expect(b.bgcolor).toEqual([181, 1, 151]);
    expect(b.spotcolor).toEqual([221, 76, 13]);
    expect(b.grid).toEqual([
      1, 1, 1, 1, 1, 0, 2, 0, 2, 0, 2, 1, 1, 1, 2, 1, 0, 1, 0, 1, 1, 2, 1, 2, 1,
    ]);
  });

  it('produces a vertically mirrored grid', () => {
    for (const size of [5, 8, 9, 12]) {
      const { grid } = createIcon({ seed: 'mirror', size });
      expect(grid).toHaveLength(size * size);
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          expect(grid[y * size + x]).toBe(grid[y * size + (size - 1 - x)]);
        }
      }
    }
  });

  it('only emits cell values 0, 1, and 2', () => {
    const { grid } = createIcon({ seed: 'values', size: 20 });
    expect(grid.every((v) => v === 0 || v === 1 || v === 2)).toBe(true);
  });

  it('skips PRNG draws for explicitly provided colors, like the original', () => {
    const seed = 'override-semantics';
    const plain = createIcon({ seed });
    const overridden = createIcon({ seed, color: '#123456' });

    // With the foreground provided, the first generated color becomes the
    // background and the second becomes the spot color.
    expect(overridden.color).toEqual([0x12, 0x34, 0x56]);
    expect(overridden.bgcolor).toEqual(plain.color);
    expect(overridden.spotcolor).toEqual(plain.bgcolor);
  });

  it('generates a random seed when omitted and echoes it back', () => {
    const a = createIcon();
    const b = createIcon();
    expect(a.seed).toBeTruthy();
    expect(createIcon({ seed: a.seed })).toEqual(a);
    expect(a.seed).not.toBe(b.seed);
  });

  it('treats an empty or null seed like an omitted one, like the original', () => {
    // An empty string would leave the PRNG unseeded and draw a solid black square.
    for (const seed of ['', null as never]) {
      const icon = createIcon({ seed });
      expect(icon.seed).toMatch(/^[0-9a-f]{14}$/);
      expect(createIcon({ seed: icon.seed })).toEqual(icon);
    }
  });

  it('converts number and bigint seeds with String()', () => {
    // The PRNG reads string characters, so a raw number used to leave it
    // unseeded and every numeric seed drew the same all-black icon.
    const icon = createIcon({ seed: '42' });
    expect(createIcon({ seed: 42 as never })).toEqual(icon);
    expect(createIcon({ seed: 42n as never })).toEqual(icon);
    expect(createIcon({ seed: 1 as never }).grid).not.toEqual(
      createIcon({ seed: 2 as never }).grid,
    );
    // Unlike `opts.seed || random` in the original, 0 is a seed, not a missing one.
    expect(createIcon({ seed: 0 as never }).seed).toBe('0');
  });

  it('rejects seeds that are not strings, numbers, or bigints', () => {
    for (const seed of [true, {}, ['a'], Symbol('seed'), () => 'seed']) {
      expect(() => createIcon({ seed: seed as never }), typeof seed).toThrow(TypeError);
    }
    expect(() => createIcon({ seed: true as never })).toThrow(
      'invalid seed type: boolean (expected a string, number, or bigint)',
    );
  });

  it('rejects invalid sizes', () => {
    expect(() => createIcon({ seed: 'x', size: 0 })).toThrow(RangeError);
    expect(() => createIcon({ seed: 'x', size: -3 })).toThrow(RangeError);
    expect(() => createIcon({ seed: 'x', size: 2.5 })).toThrow(RangeError);
  });
});

describe('parseColor', () => {
  it('parses #rrggbb', () => {
    expect(parseColor('#ff0080')).toEqual([255, 0, 128]);
    expect(parseColor('#FFFFFF')).toEqual([255, 255, 255]);
  });

  it('parses #rgb shorthand', () => {
    expect(parseColor('#f08')).toEqual([255, 0, 136]);
    expect(parseColor('#000')).toEqual([0, 0, 0]);
  });

  it('passes through valid RGB tuples', () => {
    expect(parseColor([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it('rejects malformed input', () => {
    expect(() => parseColor('red')).toThrow(TypeError);
    expect(() => parseColor('#12345')).toThrow(TypeError);
    expect(() => parseColor([1, 2] as never)).toThrow(TypeError);
    expect(() => parseColor([0, 0, 256] as never)).toThrow(TypeError);
    expect(() => parseColor([0.5, 0, 0] as never)).toThrow(TypeError);
  });
});

describe('rgbToCss', () => {
  it('formats an RGB tuple as a CSS color', () => {
    expect(rgbToCss([12, 34, 56])).toBe('rgb(12,34,56)');
  });
});

describe('iconRuns', () => {
  it('reconstructs the exact grid when expanded', () => {
    for (const seed of ['runs-a', 'runs-b', 'runs-c']) {
      const icon = createIcon({ seed, size: 10 });
      const rebuilt = new Array(icon.size * icon.size).fill(0);
      for (const run of iconRuns(icon)) {
        for (let i = 0; i < run.width; i++) {
          rebuilt[run.y * icon.size + run.x + i] = run.value;
        }
      }
      expect(rebuilt).toEqual([...icon.grid]);
    }
  });

  it('merges adjacent same-colored cells into single runs', () => {
    const icon = createIcon({ seed: 'merge-check', size: 12 });
    const runs = iconRuns(icon);
    for (const run of runs) {
      expect(run.value === 1 || run.value === 2).toBe(true);
      // A run never continues into a cell of the same value.
      const after = run.x + run.width;
      if (after < icon.size) {
        expect(icon.grid[run.y * icon.size + after]).not.toBe(run.value);
      }
      if (run.x > 0) {
        expect(icon.grid[run.y * icon.size + run.x - 1]).not.toBe(run.value);
      }
    }
  });
});
