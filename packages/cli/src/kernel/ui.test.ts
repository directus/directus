import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CliError } from './error.js';
import { clearSecrets, registerSecret } from './secret.js';
import { createUi } from './ui.js';

const ESC = String.fromCodePoint(27);

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

	it('routes uncolored status to stderr and suppresses machine data outside --json', () => {
		const ui = createUi({ json: false, color: false });
		ui.info('working');
		ui.data({ ok: true });

		expect(stderr.join('')).toContain('working');
		expect(stdout.join('')).toBe('');
		expect(stderr.join('')).not.toContain(ESC);
	});

	it('routes machine data to stdout in --json mode', () => {
		const ui = createUi({ json: true, color: false });
		ui.data({ ok: true });
		ui.data('done');

		expect(stdout).toEqual(['{"ok":true}\n', '"done"\n']);
	});

	it('keeps semantic styles out of JSON strings even when color is enabled', () => {
		const ui = createUi({ json: true, color: true });

		expect(ui.style.strong('profile')).toBe('profile');
		expect(ui.style.muted('https://example.com')).toBe('https://example.com');
		expect(ui.style.warning('claimed')).toBe('claimed');
	});

	it('suppresses human status in --json mode so stdout stays a clean channel', () => {
		const ui = createUi({ json: true, color: false });
		ui.info('working');
		ui.success('done');
		ui.print('human row');

		expect(stderr.join('')).toBe('');
		expect(stdout.join('')).toBe('');
	});

	it('emits warnings on stderr even in --json mode — CI is where they matter most', () => {
		const ui = createUi({ json: true, color: false });
		ui.warn('operation "notify" carries an Authorization header');

		expect(stderr.join('')).toContain('Authorization header');
		expect(stdout.join('')).toBe('');
	});

	it('emits a complete tagged ErrorReport on stdout only in --json mode', () => {
		const ui = createUi({ json: true, color: false });
		ui.error(new CliError('USAGE', 'bad input', { hint: 'try --from', detail: 'received --to only' }));

		expect(JSON.parse(stdout.join(''))).toEqual({
			kind: 'ErrorReport',
			formatVersion: 1,
			error: {
				code: 'USAGE',
				message: 'bad input',
				hint: 'try --from',
				detail: 'received --to only',
			},
		});

		expect(stderr.join('')).toBe('');
	});

	it('renders errors with a hint on stderr in human mode', () => {
		const ui = createUi({ json: false, color: false });
		ui.error(new CliError('USAGE', 'bad input', { hint: 'try --from' }));

		const text = stderr.join('');
		expect(text).toContain('bad input');
		expect(text).toContain('try --from');
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

		expect(JSON.parse(stdout.join('')).error.message).toBe('boom ***');
	});

	it('redacts a registered secret used as an object KEY in machine data output', () => {
		registerSecret('leaked-token-abc123');
		const ui = createUi({ json: true, color: false });
		ui.data({ 'leaked-token-abc123': 'value' });

		const out = stdout.join('');
		expect(out).not.toContain('leaked-token-abc123');
		expect(JSON.parse(out)).toEqual({ '***': 'value' });
	});

	it('redacts a secret nested deep inside arrays and objects on the machine channel', () => {
		registerSecret('leaked-token-abc123');
		const ui = createUi({ json: true, color: false });
		ui.data({ items: [{ nested: { token: 'leaked-token-abc123' } }] });

		const out = stdout.join('');
		expect(out).not.toContain('leaked-token-abc123');
		expect(JSON.parse(out)).toEqual({ items: [{ nested: { token: '***' } }] });
	});

	it('preserves a `__proto__` key in machine data output instead of losing it to the prototype setter', () => {
		const ui = createUi({ json: true, color: false });
		ui.data(JSON.parse('{"__proto__":"present"}'));

		expect(JSON.parse(stdout.join(''))).toEqual(JSON.parse('{"__proto__":"present"}'));
	});

	it('redacts a secret that JSON-escaping would otherwise hide on the machine channel', () => {
		const secret = 'abc"def\\ghi';
		registerSecret(secret);
		const ui = createUi({ json: true, color: false });
		ui.data({ token: secret });

		const out = stdout.join('');
		expect(out).not.toContain('abc');
		expect(JSON.parse(out)).toEqual({ token: '***' });
	});
});
