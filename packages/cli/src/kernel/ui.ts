import { Chalk } from 'chalk';
import type { CliError } from './error.js';

// Fancy glyphs on capable terminals; ASCII on legacy Windows consoles that would
// render them as mojibake. Modern Windows terminals set these vars; elsewhere is
// assumed capable.
const unicode =
	process.platform !== 'win32' || Boolean(process.env['WT_SESSION']) || process.env['TERM_PROGRAM'] === 'vscode';

function glyph(fancy: string, ascii: string): string {
	return unicode ? fancy : ascii;
}

const SYMBOLS = {
	info: glyph('●', 'i'),
	success: glyph('◇', '+'),
	warn: glyph('▲', '!'),
	error: glyph('✖', 'x'),
	step: glyph('◆', '>'),
};

// Two channels kept strictly separate so stdout stays a clean machine channel:
// requested output (print, data) → stdout; status (info/success/warn/step) →
// stderr, suppressed under --json. error() renders human on stderr, or structured
// JSON on stdout under --json.
export interface Ui {
	readonly json: boolean;
	print(text: string): void;
	info(message: string): void;
	success(message: string): void;
	warn(message: string): void;
	step(message: string): void;
	error(error: CliError): void;
	data(payload: unknown): void;
}

export function createUi(options: { json: boolean; color: boolean }): Ui {
	// Explicit level 0 disables color (honors --no-color); otherwise chalk
	// auto-detects the TTY and respects NO_COLOR / FORCE_COLOR itself.
	const c = new Chalk(options.color ? {} : { level: 0 });
	const { json } = options;

	function status(symbol: string, message: string): void {
		if (json) return;
		process.stderr.write(`${symbol} ${message}\n`);
	}

	return {
		json,
		print(text) {
			process.stdout.write(`${text}\n`);
		},
		info(message) {
			status(c.cyan(SYMBOLS.info), message);
		},
		success(message) {
			status(c.green(SYMBOLS.success), message);
		},
		warn(message) {
			status(c.yellow(SYMBOLS.warn), message);
		},
		step(message) {
			status(c.magenta(SYMBOLS.step), message);
		},
		error(error) {
			if (json) {
				process.stdout.write(`${JSON.stringify({ error: { code: error.code, message: error.message } })}\n`);
				return;
			}

			process.stderr.write(`${c.red(SYMBOLS.error)} ${error.message}\n`);
			if (error.hint !== undefined) process.stderr.write(`  ${c.dim(error.hint)}\n`);
		},
		data(payload) {
			process.stdout.write(`${typeof payload === 'string' ? payload : JSON.stringify(payload)}\n`);
		},
	};
}
