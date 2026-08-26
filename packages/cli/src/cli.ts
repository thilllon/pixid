import { randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { toPng } from '@pixid/png';
import { toSvg } from '@pixid/svg';

declare const __PKG_VERSION__: string;

const HELP = `pixid - blocky identicon generator

Usage:
  pixid [seed] [options]

Options:
  -s, --seed <seed>       seed string (same as the positional argument)
  -o, --out <file>        output path (default: <seed>.<format>)
  -f, --format <format>   png or svg (default: inferred from --out, else png)
      --size <n>          cells per side (default: 8)
      --scale <n>         pixels per cell (default: 16)
      --color <color>     foreground color, #rgb or #rrggbb
      --bgcolor <color>   background color, #rgb or #rrggbb
      --spotcolor <color> accent color, #rgb or #rrggbb
  -h, --help              show this message
  -v, --version           show the version

Examples:
  npx pixid
  npx pixid 0x8ba1f109551bd432803012645ac136ddd64dba72
  npx pixid --seed alice --out alice.svg --scale 32
  npx pixid --format svg --bgcolor "#ffffff"
`;

const fail = (message: string): never => {
  process.stderr.write(`pixid: ${message}\n\nRun "pixid --help" for usage.\n`);
  process.exit(1);
};

const parsePositiveInt = (name: string, value: string): number => {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) {
    return fail(`--${name} must be a positive integer, got ${JSON.stringify(value)}`);
  }
  return n;
};

const main = (): void => {
  let args;
  try {
    args = parseArgs({
      allowPositionals: true,
      options: {
        seed: { type: 'string', short: 's' },
        out: { type: 'string', short: 'o' },
        format: { type: 'string', short: 'f' },
        size: { type: 'string' },
        scale: { type: 'string' },
        color: { type: 'string' },
        bgcolor: { type: 'string' },
        spotcolor: { type: 'string' },
        help: { type: 'boolean', short: 'h' },
        version: { type: 'boolean', short: 'v' },
      },
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }

  const { values, positionals } = args;

  if (values.help) {
    process.stdout.write(HELP);
    return;
  }
  if (values.version) {
    process.stdout.write(`${__PKG_VERSION__}\n`);
    return;
  }
  if (positionals.length > 1) {
    return fail(`expected at most one positional argument, got ${positionals.length}`);
  }
  if (values.seed !== undefined && positionals.length > 0) {
    return fail('pass the seed either as a positional argument or with --seed, not both');
  }

  const seed = values.seed ?? positionals[0] ?? randomUUID();

  let format = values.format;
  if (format === undefined && values.out !== undefined) {
    format = values.out.toLowerCase().endsWith('.svg') ? 'svg' : 'png';
  }
  format ??= 'png';
  if (format !== 'png' && format !== 'svg') {
    return fail(`--format must be "png" or "svg", got ${JSON.stringify(format)}`);
  }

  const out = values.out ?? `${seed.replace(/[^a-zA-Z0-9._-]/g, '_')}.${format}`;
  const size = values.size === undefined ? undefined : parsePositiveInt('size', values.size);
  const scale = values.scale === undefined ? 16 : parsePositiveInt('scale', values.scale);

  const options = {
    seed,
    size,
    scale,
    color: values.color,
    bgcolor: values.bgcolor,
    spotcolor: values.spotcolor,
  };

  let data: Uint8Array | string;
  try {
    data = format === 'png' ? toPng(options) : toSvg(options);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }

  const outPath = resolve(process.cwd(), out);
  writeFileSync(outPath, data);
  process.stdout.write(
    `${outPath} (${typeof data === 'string' ? data.length : data.byteLength} bytes)\n`,
  );
};

main();
