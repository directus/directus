import { beforeEach, describe, expect, it } from 'vitest';
import { runSync, useSyncWorld } from './sync.test-support.js';

const world = useSyncWorld();
let dir: string;
let stdout: string[];
let stderr: string[];

beforeEach(() => {
	({ dir, stdout, stderr } = world);
});

function d6s(...argv: string[]): Promise<number> {
	return runSync(dir, argv);
}

describe('sync bare wizard wiring', () => {
	it('runs the wizard for bare `sync` and refuses without a terminal, pointing at the subcommands', async () => {
		expect(await d6s('sync')).toBe(1);

		const err = stderr.join('');
		expect(err).toMatch(/needs a terminal/i);
		expect(err).toMatch(/sync pull/i);
	});

	it('does NOT fire the wizard when a subcommand is given (sync pull still routes to pull)', async () => {
		// A subcommand present means the parent action must not fire: `sync pull` with no --from is pull's own
		// required-option error, not the wizard's terminal refusal.
		expect(await d6s('sync', 'pull')).toBe(1);

		const err = stderr.join('');
		expect(err).not.toMatch(/needs a terminal/i);
		expect(err).toMatch(/--from/);
	});

	it('still prints help for `sync --help`', async () => {
		expect(await d6s('sync', '--help')).toBe(0);
		expect(stdout.join('')).toMatch(/Sync schema and configuration/i);
	});
});
