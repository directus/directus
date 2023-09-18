import { expect, test, vi } from 'vitest';
import { updateCheck } from './index.js';
import stripAnsi from 'strip-ansi';

vi.mock('got', () => {
	const manifest = {
		'dist-tags': { latest: '10.6.1' },
		versions: {
			'10.4.3': {},
			'10.5.0': {},
			'10.5.1': {},
			'10.5.2': {},
			'10.5.3': {},
			'10.6.0': {},
			'10.6.1': {},
			'10.7.0-beta.0': {},
		},
	};

	return { default: () => ({ json: () => manifest }) };
});

test('#updateCheck', async () => {
	const consoleMock = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

	const currentVersion = '10.5.0';
	await updateCheck(currentVersion);

	const output = consoleMock.mock.calls?.[0]?.[0];

	// TODO 'vi.StubEnv' doesn't seem to work, which means we cannot use
	//      'FORCE_COLOR' to ensure output is the same on every platform.
	//      Therefore stripping away ANSI codes for now.
	const cleanOutput = output ? stripAnsi(output) : output;

	expect(cleanOutput).toMatchInlineSnapshot(`
		"
		   ╭───────────────────────────────────────────────────╮
		   │                                                   │
		   │                 Update available!                 │
		   │                                                   │
		   │                  10.5.0 → 10.6.1                  │
		   │                 5 versions behind                 │
		   │                                                   │
		   │                 More information:                 │
		   │   https://github.com/directus/directus/releases   │
		   │                                                   │
		   ╰───────────────────────────────────────────────────╯
		"
	`);
});
