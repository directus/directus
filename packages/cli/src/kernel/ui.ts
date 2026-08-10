import { Chalk } from 'chalk';
import { isPlainObject } from 'lodash-es';
import type { CliError } from './error.js';
import { redact } from './secret.js';

/**
 * Here rather than with the renderer, because painting and rendering must agree on these exactly and the
 * kernel cannot import a feature domain to find out.
 */
export const KIND_TOKENS = { added: '+', modified: '~', deleted: '✖ DELETE' } as const;

/** Opens the deleted count of an import line; the line's tail is painted from it. */
export const DELETED_MARK = '✖';

// ASCII on legacy Windows consoles, which render the fancy glyphs as mojibake. Modern Windows terminals
// set these vars; everything else is assumed capable.
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

/** Exported so Commander's own output goes through the same redaction boundary. */
export function writeOut(text: string): void {
	process.stdout.write(redact(text));
}

function writeErr(text: string): void {
	process.stderr.write(redact(text));
}

// Redact before serialization to cover escaped values and attacker-controlled object keys. Rebuild with
// Object.fromEntries so a `__proto__` key remains an own data property.
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

// Keep final-boundary redaction as a backstop for anything the structured transform misses.
function writeJson(payload: unknown): void {
	const body = JSON.stringify(redactValue(payload));
	writeOut(`${body ?? 'null'}\n`);
}

/** Human status goes to stderr; JSON results and errors go to stdout, exclusively. */
export interface Ui {
	readonly json: boolean;
	/** Honors the global color setting. */
	readonly style: {
		strong(text: string): string;
		muted(text: string): string;
		warning(text: string): string;
	};
	print(text: string): void;
	/** A plan line, with its change token colored: green +, yellow ~, red deletions. */
	plan(text: string): void;
	info(message: string): void;
	success(message: string): void;
	warn(message: string): void;
	error(error: CliError): void;
	/** JSON only; a no-op in human mode. */
	result(payload: unknown): void;
}

export function createUi(options: { json: boolean; color: boolean }): Ui {
	const c = new Chalk(options.color && !options.json ? {} : { level: 0 });
	const { json } = options;

	function status(symbol: string, message: string): void {
		if (json) return;
		writeErr(`${symbol} ${message}\n`);
	}

	// Deletions are painted whole-line, not just their token: they are what an approval must not miss. The
	// destructive tail of a data line (`✖N deleted (…)`) goes red too, whenever N is non-zero.
	function paintPlan(line: string): string {
		if (line.startsWith(KIND_TOKENS.deleted)) return c.red(line);
		if (line.startsWith(KIND_TOKENS.added))
			return `${c.green(KIND_TOKENS.added)}${line.slice(KIND_TOKENS.added.length)}`;

		if (line.startsWith(KIND_TOKENS.modified)) {
			const painted = `${c.yellow(KIND_TOKENS.modified)}${line.slice(KIND_TOKENS.modified.length)}`;
			const tail = painted.indexOf(DELETED_MARK);

			if (tail !== -1 && !painted.slice(tail).startsWith(`${DELETED_MARK}0 `)) {
				return painted.slice(0, tail) + c.red(painted.slice(tail));
			}

			return painted;
		}

		return line;
	}

	return {
		json,
		style: {
			strong(text) {
				return c.bold(text);
			},
			muted(text) {
				return c.dim(text);
			},
			warning(text) {
				return c.yellow(text);
			},
		},
		print(text) {
			if (json) return;
			writeOut(`${text}\n`);
		},
		plan(text) {
			writeOut(`${paintPlan(text)}\n`);
		},
		info(message) {
			status(c.cyan(SYMBOLS.info), message);
		},
		success(message) {
			status(c.green(SYMBOLS.success), message);
		},
		warn(message) {
			// stderr even in JSON mode: visible in CI without contaminating the JSON on stdout.
			writeErr(`${c.yellow(SYMBOLS.warn)} ${message}\n`);
		},
		error(error) {
			if (json) {
				const body = {
					code: error.code,
					message: error.message,
					...(error.hint !== undefined ? { hint: error.hint } : {}),
					...(error.detail !== undefined ? { detail: error.detail } : {}),
				};

				writeJson({ error: body });
				return;
			}

			writeErr(`${c.red(SYMBOLS.error)} ${error.message}\n`);
			if (error.hint !== undefined) writeErr(`  ${c.dim(error.hint)}\n`);
			if (error.detail !== undefined) writeErr(`  ${c.dim(error.detail)}\n`);
		},
		result(payload) {
			if (!json) return;
			writeJson(payload);
		},
	};
}
