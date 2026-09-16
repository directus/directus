import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';
import Sequencer from './setup/sequencer';

const isMssql = (process.env['TEST_DB']?.split(',').map((v) => v.trim()) ?? []).includes('mssql');

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		// Vitest 4 removed `poolOptions`; the per-pool fork cap is now the top-level worker cap.
		// `minForks: 1` has no v4 equivalent (`minWorkers` was removed outright) and is dropped.
		maxWorkers: isMssql ? 2 : 6,
		// Was a custom `environment`, which Vitest 4 now runs before the worker state exists.
		// See the comment in `setup/gate.ts`.
		setupFiles: './setup/gate.ts',
		sequence: {
			sequencer: Sequencer,
		},
		testTimeout: isMssql ? 75_000 : 45_000,
		// Previously `vitest.workspace.ts`, which Vitest 4 replaced with `projects`.
		// `extends: true` inherits the options above, matching the old `extends: './vitest.config.ts'`.
		projects: [
			{
				extends: true,
				test: {
					name: 'common',
					include: ['tests/common/**/*.test.ts', 'common/common.test.ts'],
					globalSetup: './setup/setup.ts',
					env: {
						TEST_PROJECT: 'common',
					},
				},
			},
			{
				extends: true,
				test: {
					name: 'db',
					include: ['tests/db/**/*.test.ts', 'common/common.test.ts'],
					globalSetup: './setup/setup.ts',
					env: {
						TEST_PROJECT: 'db',
					},
				},
			},
		],
	},
});
