import { Chalk } from 'chalk';
import type { CliError } from './result.js';

// Unicode-aware symbols: fancy glyphs on capable terminals, ASCII on dumb/legacy
// ones. Detection is inlined (it never changes) rather than adding a dependency.
function isUnicodeSupported(): boolean {
	const { env, platform } = process;
	if (platform !== 'win32') return env['TERM'] !== 'linux';

	return (
		Boolean(env['WT_SESSION']) ||
		Boolean(env['TERMINUS_SUBLIME']) ||
		env['ConEmuTask'] === '{cmd::Cmder}' ||
		env['TERM_PROGRAM'] === 'vscode' ||
		env['TERM'] === 'xterm-256color' ||
		env['TERM'] === 'alacritty' ||
		env['TERMINAL_EMULATOR'] === 'JetBrains-JediTerm'
	);
}

const unicode = isUnicodeSupported();

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

export interface Ui {
	readonly json: boolean;
	// Requested output — help, version, rendered results — goes to stdout.
	print(text: string): void;
	// Status / progress goes to stderr and is suppressed in --json mode, so
	// stdout stays a clean machine channel.
	info(message: string): void;
	success(message: string): void;
	warn(message: string): void;
	step(message: string): void;
	// Errors render human-readable on stderr, or structured on stdout in --json.
	error(error: CliError): void;
	// Machine payload → stdout.
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
