import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { run } from './run.js';
import { clearSecrets, registerSecret } from './secret.js';

type RegisterCommands = Parameters<typeof run>[1]['registerCommands'];

interface PullOptions {
	readonly from: string;
}

function registerSync(options: { onRun?: (options: PullOptions) => void; throws?: unknown } = {}): RegisterCommands {
	return (program) => {
		program
			.command('sync')
			.command('pull')
			.requiredOption('--from <profile>', 'Source profile')
			.action((pullOptions: PullOptions) => {
				options.onRun?.(pullOptions);
				if (options.throws !== undefined) throw options.throws;
			});
	};
}

describe('run', () => {
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

	it('parses global options and dispatches the selected command', async () => {
		let from: string | undefined;

		expect(
			await run(['sync', 'pull', '--from', 'local', '--json'], {
				registerCommands: registerSync({ onRun: (options) => (from = options.from) }),
			}),
		).toBe(0);

		expect(from).toBe('local');
	});

	it('renders Commander errors through the CLI error boundary', async () => {
		expect(await run(['sync', 'pull', '--from', 'local', '--bogus'], { registerCommands: registerSync() })).toBe(1);
		expect(stderr.join('')).toContain("unknown option '--bogus'");
	});

	it('masks inline values in Commander errors', async () => {
		const secret = 'super-secret-token';
		const argv = ['sync', 'pull', '--from', 'local', `--token=${secret}`];

		expect(await run(argv, { registerCommands: registerSync() })).toBe(1);
		expect(stderr.join('')).toContain("unknown option '--token=***'");
		expect(stderr.join('')).not.toContain(secret);

		stderr.length = 0;
		expect(await run([...argv, '--json'], { registerCommands: registerSync() })).toBe(1);
		expect(stdout.join('')).toContain("unknown option '--token=***'");
		expect(stdout.join('')).not.toContain(secret);
	});

	it('returns a failing status for errors thrown by commands', async () => {
		expect(
			await run(['sync', 'pull', '--from', 'local'], {
				registerCommands: registerSync({ throws: new Error('boom') }),
			}),
		).toBe(1);

		expect(stderr.join('')).toContain('boom');
	});

	it('classifies unknown commands in JSON errors', async () => {
		expect(await run(['nope', '--json'], { registerCommands: registerSync() })).toBe(1);
		expect(JSON.parse(stdout.join('')).error.code).toBe('UNKNOWN_COMMAND');
		expect(stderr.join('')).toBe('');
	});

	it('shows root, group, and command help on stdout', async () => {
		const cases: [argv: string[], expected: string][] = [
			[[], 'sync'],
			[['sync'], 'pull'],
			[['help', 'sync'], 'pull'],
			[['sync', 'help', 'pull'], '--from <profile>'],
		];

		for (const [argv, expected] of cases) {
			stdout.length = 0;
			stderr.length = 0;

			expect(await run(argv, { registerCommands: registerSync() })).toBe(0);
			expect(stdout.join('')).toContain(expected);
			expect(stderr.join('')).toBe('');
		}
	});

	it('redacts Commander help output', async () => {
		registerSecret('leaked-token-abc123');

		const registerSafe: RegisterCommands = (program) => {
			program
				.command('safe')
				.description('prints leaked-token-abc123')
				.action(() => {});
		};

		expect(await run(['safe', '--help'], { registerCommands: registerSafe })).toBe(0);
		expect(stdout.join('')).toContain('***');
		expect(stdout.join('')).not.toContain('leaked-token-abc123');
	});

	it('loads project environment variables relative to discovered config', async () => {
		const root = mkdtempSync(join(tmpdir(), 'd6s-env-'));

		try {
			writeFileSync(join(root, 'directus.config.json'), '{}');
			writeFileSync(join(root, '.env'), 'DIRECTUS_ENVTEST_TOKEN=from-root\n');

			const cwd = join(root, 'nested', 'deep');
			mkdirSync(cwd, { recursive: true });
			let value: string | undefined;

			const registerEnv: RegisterCommands = (program, getContext) => {
				program.command('env').action(() => {
					getContext();
					value = process.env['DIRECTUS_ENVTEST_TOKEN'];
				});
			};

			await run(['env'], { registerCommands: registerEnv, cwd });
			expect(value).toBe('from-root');
		} finally {
			delete process.env['DIRECTUS_ENVTEST_TOKEN'];
			rmSync(root, { recursive: true, force: true });
		}
	});
});
