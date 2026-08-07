import { Chalk } from 'chalk';
import { isPlainObject } from 'lodash-es';
import type { CliError } from './error.js';
import { redact } from './secret.js';

/**
 * The leading tokens of a plan line. They live here, not with the renderer, because painting and
 * rendering must agree on them exactly — and the kernel cannot import a feature domain to find out.
 */
export const KIND_TOKENS = { added: '+', modified: '~', deleted: '✖ DELETE' } as const;

/** The marker opening the deleted count of an import line; the line's tail is painted from it. */
export const DELETED_MARK = '✖';

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

/** Keep redaction at the final output boundary, including Commander output. */
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

/** Human status uses stderr. JSON results and errors use stdout exclusively. */
export interface Ui {
	readonly json: boolean;
	/** Semantic text styles that honor the global color setting. */
	readonly style: {
		strong(text: string): string;
		muted(text: string): string;
		warning(text: string): string;
	};
	print(text: string): void;
	/** Print a schema/data plan line with its change token colored (green +, yellow ~, red deletions). */
	plan(text: string): void;
	info(message: string): void;
	success(message: string): void;
	warn(message: string): void;
	error(error: CliError): void;
	/** Emit tagged and versioned JSON for machine consumers. */
	data(payload: unknown): void;
}

/** Create human or JSON CLI output with final-boundary secret redaction. */
export function createUi(options: { json: boolean; color: boolean }): Ui {
	const c = new Chalk(options.color && !options.json ? {} : { level: 0 });
	const { json } = options;

	function status(symbol: string, message: string): void {
		if (json) return;
		writeErr(`${symbol} ${message}\n`);
	}

	// Color carries the change semantics a scanning eye reads first: deletions whole-line red (they are
	// the records an approval must not miss), additions' token green, modifications' token yellow — plus the
	// destructive tail of a data line (`✖N deleted (…)`) red whenever N is non-zero.
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
			// Keep warnings visible in CI without contaminating JSON stdout.
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

				writeJson({ kind: 'ErrorReport', error: body });
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
