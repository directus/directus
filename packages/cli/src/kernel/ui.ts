import { Chalk } from 'chalk';
import { isPlainObject } from 'lodash-es';
import type { CliError } from './error.js';
import { redact } from './secret.js';

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
};

// Keep redaction at the final output boundary, including Commander output.
export function writeOut(text: string): void {
	process.stdout.write(redact(text));
}

export function writeErr(text: string): void {
	process.stderr.write(redact(text));
}

// Redact before serialization so a secret can't survive by being JSON-escaped, and
// so object KEYS are covered too — a replacer only sees values, but payloads embed
// remote-controlled record maps where the key is attacker-reachable. Rebuild plain
// objects via Object.fromEntries so a `__proto__` key becomes an own data property
// instead of hitting the prototype setter and vanishing.
function redactValue(value: unknown): unknown {
	if (typeof value === 'string') return redact(value);
	if (Array.isArray(value)) return value.map(redactValue);

	if (isPlainObject(value)) {
		return Object.fromEntries(
			Object.entries(value as Record<string, unknown>).map(([key, val]) => [redact(key), redactValue(val)]),
		);
	}

	return value;
}

// Two redaction layers: redactValue is primary (covers keys and defeats JSON-escaping),
// and writeOut is the final-boundary backstop for anything the transform misses.
function writeJson(payload: unknown): void {
	const body = JSON.stringify(redactValue(payload));
	writeOut(`${body ?? 'null'}\n`);
}

// Human status uses stderr. JSON results and errors use stdout exclusively.
export interface Ui {
	readonly json: boolean;
	print(text: string): void;
	info(message: string): void;
	success(message: string): void;
	warn(message: string): void;
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
		writeErr(`${symbol} ${message}\n`);
	}

	return {
		json,
		print(text) {
			if (json) return;
			writeOut(`${text}\n`);
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
		error(error) {
			if (json) {
				const body = {
					code: error.code,
					message: error.message,
					...(error.hint !== undefined ? { hint: error.hint } : {}),
					...(error.detail !== undefined ? { detail: error.detail } : {}),
				};

				// kind + formatVersion lead every machine payload so consumers dispatch on the tag;
				// the inner error object is unchanged.
				writeJson({ kind: 'ErrorReport', formatVersion: 1, error: body });
				return;
			}

			writeErr(`${c.red(SYMBOLS.error)} ${error.message}\n`);
			if (error.hint !== undefined) writeErr(`  ${c.dim(error.hint)}\n`);
			if (error.detail !== undefined) writeErr(`  ${c.dim(error.detail)}\n`);
		},
		data(payload) {
			if (!json) return;
			writeJson(payload);
		},
	};
}
