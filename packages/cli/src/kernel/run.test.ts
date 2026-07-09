import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import type { CommandDefinition, CommandGroup } from './command.js';
import { CliError } from './error.js';
import { run } from './run.js';

function syncGroup(options: {
	onRun?: (args: { from: string }, positionals: string[]) => void;
	throws?: unknown;
}): CommandGroup {
	const pull: CommandDefinition = {
		name: 'pull',
		description: 'Pull schema from a source',
		args: z.object({ from: z.string().describe('Source profile') }),
		run({ args, positionals }) {
			options.onRun?.(args as { from: string }, positionals);
			if (options.throws !== undefined) throw options.throws;
		},
	};

	return { name: 'sync', description: 'Sync', commands: { pull } };
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
		expect(await run(['--version'], { commands: [] })).toBe(0);
	});

	it('honors --version even when a command is present (terminal, position-independent)', async () => {
		// `sync` alone would be an unknown command (exit 1); returning 0 proves
		// --version short-circuited before dispatch.
		expect(await run(['sync', '--version'], { commands: [syncGroup({})] })).toBe(0);
	});

	it('dispatches a command with parsed args and exits 0', async () => {
		const seen: string[] = [];

		const code = await run(['sync', 'pull', '--from', 'local'], {
			commands: [syncGroup({ onRun: (args) => seen.push(args.from) })],
		});

		expect(code).toBe(0);
		expect(seen).toEqual(['local']);
	});

	it('treats tokens after `--` as literal positionals, not global flags', async () => {
		let positionals: string[] | undefined;

		const code = await run(['sync', 'pull', '--from', 'x', '--', '--version', 'file'], {
			commands: [syncGroup({ onRun: (_args, p) => (positionals = p) })],
		});

		// The command RAN (so --version after -- did not short-circuit to version
		// print) and the literal tokens reached it as positionals.
		expect(code).toBe(0);
		expect(positionals).toEqual(['--version', 'file']);
	});

	it('exits 1 when a required flag is missing', async () => {
		expect(await run(['sync', 'pull'], { commands: [syncGroup({})] })).toBe(1);
	});

	it('maps a thrown CliError to its own exit code', async () => {
		const code = await run(['sync', 'pull', '--from', 'x'], {
			commands: [syncGroup({ throws: new CliError('STATE', 'boom', { exitCode: 2 }) })],
		});

		expect(code).toBe(2);
	});

	it('exits 1 for an unknown command', async () => {
		expect(await run(['nope'], { commands: [] })).toBe(1);
	});

	it('offers a did-you-mean for a prefix typo', async () => {
		const code = await run(['sync', 'pul'], { commands: [syncGroup({})] });

		expect(code).toBe(1);
		expect(stderr.join('')).toContain('Did you mean "sync pull"');
	});

	it('does not offer an absurd did-you-mean for an unrelated command', async () => {
		const code = await run(['zzz', 'qqq'], { commands: [syncGroup({})] });

		expect(code).toBe(1);
		expect(stderr.join('')).not.toContain('Did you mean');
	});

	it('routes --help to command help and exits 0', async () => {
		expect(await run(['sync', 'pull', '--help'], { commands: [syncGroup({})] })).toBe(0);
	});

	it('normalizes a non-CliError thrown by a command to exit 1, never silent success', async () => {
		// A command leaking a non-CliError must not exit 0 — a failed command
		// silently reporting success to the shell is the worst outcome.
		const code = await run(['sync', 'pull', '--from', 'x'], {
			commands: [syncGroup({ throws: { nope: true } })],
		});

		expect(code).toBe(1);
	});

	it('clamps an out-of-range exit code so the process boundary never throws', async () => {
		// exitCode -1 would make `process.exitCode = -1` throw RangeError; the
		// boundary must coerce it to a valid failing code instead of crashing.
		const code = await run(['sync', 'pull', '--from', 'x'], {
			commands: [syncGroup({ throws: new CliError('STATE', 'boom', { exitCode: -1 }) })],
		});

		expect(code).toBe(1);
	});
});
