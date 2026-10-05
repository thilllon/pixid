import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createIcon, toPng, toSvg } from '@pixid/core';
import { Command, CommanderError } from 'commander';

declare const __PKG_VERSION__: string;

/** Version of `@pixid/cli`, baked in at build time. */
export const version: string = __PKG_VERSION__;

const EXAMPLES = `
Examples:
  npx @pixid/cli
  npx @pixid/cli 0x8ba1f109551bd432803012645ac136ddd64dba72
  npx @pixid/cli --seed alice --out alice.svg --scale 32
  npx @pixid/cli --format svg --bgcolor "#ffffff"
`;

interface CliOptions {
  seed?: string;
  out?: string;
  format?: string;
  size?: string;
  scale?: string;
  color?: string;
  bgcolor?: string;
  spotcolor?: string;
}

/**
 * Declares the command line. A `Command` keeps what it parsed, so every run
 * gets a new one. Option values stay strings: `runCli` validates them itself
 * so that every error has the same shape.
 */
const createProgram = (): Command =>
  new Command('pixid')
    .description('blocky identicon generator')
    .argument('[seed]', 'seed string (default: a random UUID)')
    .option('-s, --seed <seed>', 'seed string (same as the positional argument)')
    .option('-o, --out <file>', 'output path (default: <seed>.<format>)')
    .option('-f, --format <format>', 'png or svg (default: inferred from --out, else png)')
    .option('--size <n>', 'cells per side (default: 8)')
    .option('--scale <n>', 'pixels per cell (default: 16; size x scale <= 4096)')
    .option('--color <color>', 'foreground color, #rgb or #rrggbb')
    .option('--bgcolor <color>', 'background color, #rgb or #rrggbb')
    .option('--spotcolor <color>', 'accent color, #rgb or #rrggbb')
    .helpOption('-h, --help', 'show this message')
    .version(version, '-v, --version', 'show the version')
    .addHelpText('after', EXAMPLES)
    // Throw instead of exiting, and say nothing on stderr: `runCli` reports
    // every failure through `fail`.
    .exitOverride()
    .configureOutput({ writeErr: () => {} });

/**
 * How many characters of the sanitized seed a default filename keeps at most.
 * File names are capped at 255 bytes on common filesystems; 100 ASCII
 * characters plus the extension stays well inside that and still fits UUIDs
 * and Ethereum addresses whole.
 */
const MAX_SEED_IN_FILENAME = 100;

/**
 * Widest image the CLI will draw, in pixels per side (`size * scale`). The
 * renderers have no bound of their own, so `--scale 100000` would sit there
 * allocating for minutes before anything reached disk. 4096 covers every
 * avatar use and keeps the PNG under about 4 MB.
 */
const MAX_EDGE_PIXELS = 4096;

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

/**
 * Runs the `pixid` command-line interface.
 *
 * Writes the generated file to disk and reports the path on stdout. Invalid
 * input is reported on stderr and terminates the process with exit code 1,
 * so this is only meant for use as a program entry point.
 *
 * @param argv Arguments after the executable and script name.
 *             Defaults to `process.argv.slice(2)`.
 */
export const runCli = (argv: string[] = process.argv.slice(2)): void => {
  const program = createProgram();
  try {
    program.parse(argv, { from: 'user' });
  } catch (error) {
    // --help and --version have already written to stdout.
    if (error instanceof CommanderError && error.exitCode === 0) return;
    const message = error instanceof Error ? error.message : String(error);
    return fail(message.replace(/^error: /, ''));
  }

  const values = program.opts<CliOptions>();
  const positionals = program.args;

  if (values.seed !== undefined && positionals.length > 0) {
    return fail('pass the seed either as a positional argument or with --seed, not both');
  }

  // An empty seed (`--seed ''` or a '' positional) counts as no seed. Used
  // as is, it would write the same icon to the hidden file `.png` every time.
  const seed = (values.seed ?? positionals[0]) || randomUUID();

  let format = values.format;
  if (format === undefined && values.out !== undefined) {
    format = values.out.toLowerCase().endsWith('.svg') ? 'svg' : 'png';
  }
  format ??= 'png';
  if (format !== 'png' && format !== 'svg') {
    return fail(`--format must be "png" or "svg", got ${JSON.stringify(format)}`);
  }

  // Only the default name is shortened; an explicit --out is used verbatim.
  const out =
    values.out ??
    `${seed.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, MAX_SEED_IN_FILENAME)}.${format}`;
  const size = values.size === undefined ? undefined : parsePositiveInt('size', values.size);
  const scale = values.scale === undefined ? 16 : parsePositiveInt('scale', values.scale);

  const edge = (size ?? 8) * scale;
  if (edge > MAX_EDGE_PIXELS) {
    return fail(
      `--size times --scale must be at most ${MAX_EDGE_PIXELS} pixels per side, got ${edge} ` +
        `(size ${size ?? 8} x scale ${scale})`,
    );
  }

  let data: Uint8Array | string;
  try {
    const icon = createIcon({
      seed,
      size,
      color: values.color,
      bgcolor: values.bgcolor,
      spotcolor: values.spotcolor,
    });
    data = format === 'png' ? toPng(icon, scale) : toSvg(icon, scale);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }

  const outPath = resolve(process.cwd(), out);
  try {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, data);
  } catch (error) {
    // EISDIR, EACCES, ENAMETOOLONG, ...: report them like invalid input
    // instead of crashing with a stack trace.
    return fail(error instanceof Error ? error.message : String(error));
  }
  process.stdout.write(
    `${outPath} (${typeof data === 'string' ? data.length : data.byteLength} bytes)\n`,
  );
};
