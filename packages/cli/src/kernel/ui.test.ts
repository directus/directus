import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CliError } from './error.js';
import { createUi } from './ui.js';

const ESC = String.fromCodePoint(27); // start byte of every ANSI escape sequence

describe('createUi', () => {
	let stdout: string[];
	let stderr: string[];

	beforeEach(() => {
		stdout = [];
		stderr = [];

		vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
			stdout.push(String(chunk));
			return true;
		});

		vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
			stderr.push(String(chunk));
			return true;
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('routes status to stderr and machine data to stdout', () => {
		const ui = createUi({ json: false, color: false });
		ui.info('working');
		ui.data({ ok: true });

		expect(stderr.join('')).toContain('working');
		expect(stdout.join('')).toContain('{"ok":true}');
	});

	it('suppresses human status in --json mode so stdout stays a clean channel', () => {
		const ui = createUi({ json: true, color: false });
		ui.info('working');
		ui.success('done');

		expect(stderr.join('')).toBe('');
	});

	it('renders errors as structured stdout in --json mode', () => {
		const ui = createUi({ json: true, color: false });
		ui.error(new CliError('USAGE', 'bad input'));

		expect(stdout.join('')).toContain('"code":"USAGE"');
		expect(stderr.join('')).toBe('');
	});

	it('renders errors with a hint on stderr in human mode', () => {
		const ui = createUi({ json: false, color: false });
		ui.error(new CliError('USAGE', 'bad input', { hint: 'try --from' }));

		const text = stderr.join('');
		expect(text).toContain('bad input');
		expect(text).toContain('try --from');
	});

	it('emits no ANSI escape codes when color is disabled', () => {
		const ui = createUi({ json: false, color: false });
		ui.warn('careful');

		expect(stderr.join('')).not.toContain(ESC);
	});
});
