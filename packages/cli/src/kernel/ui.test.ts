import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CliError } from './error.js';
import { clearSecrets, registerSecret } from './secret.js';
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
		clearSecrets();
	});

	it('routes status to stderr and suppresses machine data outside --json', () => {
		const ui = createUi({ json: false, color: false });
		ui.info('working');
		ui.data({ ok: true });

		expect(stderr.join('')).toContain('working');
		expect(stdout.join('')).toBe('');
	});

	it('routes machine data to stdout in --json mode', () => {
		const ui = createUi({ json: true, color: false });
		ui.data({ ok: true });
		ui.data('done');

		expect(stdout).toEqual(['{"ok":true}\n', '"done"\n']);
	});

	it('suppresses human status in --json mode so stdout stays a clean channel', () => {
		const ui = createUi({ json: true, color: false });
		ui.info('working');
		ui.success('done');
		ui.print('human row');

		expect(stderr.join('')).toBe('');
		expect(stdout.join('')).toBe('');
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
		ui.info('careful');

		expect(stderr.join('')).not.toContain(ESC);
	});

	it('redacts a registered token from a human error, even if it reaches the message', () => {
		registerSecret('leaked-token-abc123');
		const ui = createUi({ json: false, color: false });
		ui.error(new CliError('AUTH', 'request failed with token leaked-token-abc123'));

		const text = stderr.join('');
		expect(text).toContain('***');
		expect(text).not.toContain('leaked-token-abc123');
	});

	it('redacts a registered token from the --json error channel the agent reads', () => {
		registerSecret('leaked-token-abc123');
		const ui = createUi({ json: true, color: false });
		ui.error(new CliError('AUTH', 'boom leaked-token-abc123'));

		expect(stdout.join('')).not.toContain('leaked-token-abc123');
	});

	it('redacts a token that appears in machine data output', () => {
		registerSecret('leaked-token-abc123');
		const ui = createUi({ json: true, color: false });
		ui.data({ token: 'leaked-token-abc123' });

		expect(stdout.join('')).not.toContain('leaked-token-abc123');
	});

	it('redacts a secret that JSON-escaping would otherwise hide on the machine channel', () => {
		// A token containing a quote serializes as `abc\"def`; redacting the finished
		// JSON string by substring would miss the escaped form. Redacting values before
		// serialization catches the raw secret regardless of how it would be escaped.
		const secret = 'abc"def\\ghi';
		registerSecret(secret);
		const ui = createUi({ json: true, color: false });
		ui.data({ token: secret });

		const out = stdout.join('');
		expect(out).not.toContain('abc');
		expect(JSON.parse(out)).toEqual({ token: '***' });
	});

	it('carries error detail on the --json channel so nothing is silently dropped', () => {
		const ui = createUi({ json: true, color: false });
		ui.error(new CliError('AUTH', 'auth failed', { detail: 'HTTP 401 from server' }));

		expect(stdout.join('')).toContain('"detail":"HTTP 401 from server"');
	});

	it('carries the hint on the --json channel so a script sees the actionable fix', () => {
		const ui = createUi({ json: true, color: false });
		ui.error(new CliError('AUTH', 'no token', { hint: 'Set DIRECTUS_PROD_TOKEN or pass --token.' }));

		expect(JSON.parse(stdout.join('')).error.hint).toBe('Set DIRECTUS_PROD_TOKEN or pass --token.');
	});
});
