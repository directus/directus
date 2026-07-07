import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { defineCommand, definePlugin, type PluginDefinition } from './plugins/define.js';
import { type CliError, cliError, err, type Result } from './result.js';
import { run } from './run.js';

function syncPlugin(options: {
	onRun?: (args: { from: string }, positionals: string[]) => void;
	outcome?: Result<void, CliError> | void;
}): PluginDefinition {
	const pull = defineCommand({
		name: 'pull',
		description: 'Pull schema from a source',
		args: z.object({ from: z.string().describe('Source profile') }),
		run({ args, positionals }) {
			options.onRun?.(args, positionals);
			return options.outcome;
		},
	});

	return definePlugin({
		name: 'sync',
		description: 'Sync',
		commands: { pull: { summary: 'Pull schema from a source', load: async () => pull } },
	});
}

describe('run', () => {
	let stderr: string[];

	beforeEach(() => {
		stderr = [];
		vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

		vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
			stderr.push(String(chunk));
			return true;
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('prints version and exits 0', async () => {
		expect(await run(['--version'], { plugins: [] })).toBe(0);
	});

	it('honors --version even when a command is present (terminal, position-independent)', async () => {
		// `sync` alone would be an unknown command (exit 1); returning 0 proves
		// --version short-circuited before dispatch.
		expect(await run(['sync', '--version'], { plugins: [syncPlugin({})] })).toBe(0);
	});

	it('dispatches a command with parsed args and exits 0', async () => {
		const seen: string[] = [];

		const code = await run(['sync', 'pull', '--from', 'local'], {
			plugins: [syncPlugin({ onRun: (args) => seen.push(args.from) })],
		});

		expect(code).toBe(0);
		expect(seen).toEqual(['local']);
	});

	it('treats tokens after `--` as literal positionals, not global flags', async () => {
		let positionals: string[] | undefined;

		const code = await run(['sync', 'pull', '--from', 'x', '--', '--version', 'file'], {
			plugins: [syncPlugin({ onRun: (_args, p) => (positionals = p) })],
		});

		// The command RAN (so --version after -- did not short-circuit to version
		// print) and the literal tokens reached it as positionals.
		expect(code).toBe(0);
		expect(positionals).toEqual(['--version', 'file']);
	});

	it('exits 1 when a required flag is missing', async () => {
		expect(await run(['sync', 'pull'], { plugins: [syncPlugin({})] })).toBe(1);
	});

	it('surfaces a command Result error with its own exit code', async () => {
		const code = await run(['sync', 'pull', '--from', 'x'], {
			plugins: [syncPlugin({ outcome: err(cliError('SYNC', 'boom', { exitCode: 2 })) })],
		});

		expect(code).toBe(2);
	});

	it('exits 1 for an unknown command', async () => {
		expect(await run(['nope'], { plugins: [] })).toBe(1);
	});

	it('offers a did-you-mean for a prefix typo', async () => {
		const code = await run(['sync', 'pul'], { plugins: [syncPlugin({})] });

		expect(code).toBe(1);
		expect(stderr.join('')).toContain('Did you mean "sync pull"');
	});

	it('does not offer an absurd did-you-mean for an unrelated command', async () => {
		const code = await run(['zzz', 'qqq'], { plugins: [syncPlugin({})] });

		expect(code).toBe(1);
		expect(stderr.join('')).not.toContain('Did you mean');
	});

	it('routes --help to command help and exits 0', async () => {
		expect(await run(['sync', 'pull', '--help'], { plugins: [syncPlugin({})] })).toBe(0);
	});

	it('does not report success when a command returns a malformed error', async () => {
		// A plugin leaking a non-CliError through `any` must not exit 0 — a failed
		// command silently reporting success to the shell is the worst outcome.
		const badOutcome = { ok: false, error: { nope: true } } as unknown as Result<void, CliError>;

		const code = await run(['sync', 'pull', '--from', 'x'], {
			plugins: [syncPlugin({ outcome: badOutcome })],
		});

		expect(code).toBe(1);
	});

	it('clamps an out-of-range exit code so the process boundary never throws', async () => {
		// exitCode -1 would make `process.exitCode = -1` throw RangeError; the
		// boundary must coerce it to a valid failing code instead of crashing.
		const code = await run(['sync', 'pull', '--from', 'x'], {
			plugins: [syncPlugin({ outcome: err(cliError('SYNC', 'boom', { exitCode: -1 })) })],
		});

		expect(code).toBe(1);
	});

	it('renders a rejected lazy command load as a CLI error instead of an unhandled rejection', async () => {
		const plugin = definePlugin({
			name: 'sync',
			description: 'Sync',
			commands: {
				pull: {
					summary: 'Pull schema from a source',
					load: async () => {
						throw new Error('module blew up');
					},
				},
			},
		});

		const code = await run(['sync', 'pull', '--from', 'x'], { plugins: [plugin] });

		expect(code).toBe(1);
		expect(stderr.join('')).toContain('module blew up');
	});
});
