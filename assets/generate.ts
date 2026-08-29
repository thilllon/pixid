/**
 * Regenerates the identicon gallery shown at the top of the README.
 *
 * Run with `pnpm assets`. The seeds below are fixed on purpose: the images are
 * committed, so a changed seed (or a changed algorithm) shows up as a diff.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { toPng } from '@pixid/png';

/** 8 cells per side * scale 16 = 128x128 px, displayed at 72 px in the README. */
const SCALE = 16;

const OUT_DIR = fileURLToPath(new URL('.', import.meta.url));

const SAMPLES = [
  { seed: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045', file: 'eth-d8da6b.png' },
  { seed: '0x8ba1f109551bd432803012645ac136ddd64dba72', file: 'eth-8ba1f1.png' },
  { seed: '0xab5801a7d398351b8be11c439e05c5b3259aec9b', file: 'eth-ab5801.png' },
  { seed: 'pixid', file: 'pixid.png' },
  { seed: 'alice', file: 'alice.png' },
  { seed: 'bob', file: 'bob.png' },
  { seed: 'thilllon', file: 'thilllon.png' },
  { seed: '550e8400-e29b-41d4-a716-446655440000', file: 'uuid-550e8400.png' },
] as const;

mkdirSync(OUT_DIR, { recursive: true });

for (const { seed, file } of SAMPLES) {
  const png = toPng({ seed, scale: SCALE });
  writeFileSync(join(OUT_DIR, file), png);
  console.log(`${file.padEnd(20)} ${String(png.length).padStart(5)} bytes  seed=${seed}`);
}
