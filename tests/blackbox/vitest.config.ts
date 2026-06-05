import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';
import Sequencer from './setup/sequencer';

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		pool: 'forks',
		maxWorkers: 6,
		sequence: {
			sequencer: Sequencer,
		},
		testTimeout: 15_000,
		projects: [
			{
				extends: true,
				test: {
					name: 'common',
					include: ['tests/common/**/*.test.ts', 'common/common.test.ts'],
					globalSetup: './setup/setup.ts',
					setupFiles: ['./setup/sequential-gate.ts'],
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
					setupFiles: ['./setup/sequential-gate.ts'],
					env: {
						TEST_PROJECT: 'db',
					},
				},
			},
		],
	},
});
