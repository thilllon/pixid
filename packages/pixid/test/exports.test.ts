import { describe, expect, it } from 'vitest';
import * as pixid from '../src/index.js';

describe('pixid meta package', () => {
  it('re-exports the core API', () => {
    expect(typeof pixid.createIcon).toBe('function');
    expect(typeof pixid.parseColor).toBe('function');
    expect(typeof pixid.iconRuns).toBe('function');
    expect(typeof pixid.rgbToCss).toBe('function');
  });

  it('re-exports the svg renderer', () => {
    expect(typeof pixid.toSvg).toBe('function');
    expect(typeof pixid.toSvgDataURL).toBe('function');
    expect(typeof pixid.iconToSvg).toBe('function');
  });

  it('re-exports the png encoder', () => {
    expect(typeof pixid.toPng).toBe('function');
    expect(typeof pixid.toPngDataURL).toBe('function');
    expect(typeof pixid.iconToPng).toBe('function');
  });

  it('produces working output through the re-exports', () => {
    expect(pixid.toSvg({ seed: 'meta' })).toContain('<svg');
    expect(pixid.toPng({ seed: 'meta' }).length).toBeGreaterThan(8);
  });
});
