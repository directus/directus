import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';
import Sequencer from './setup/sequencer';

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		poolOptions: {
			forks: {
				minForks: 1,
				// mssql is slower and RAM-hungrier; fewer forks avoids contention that times tests out
				maxForks: process.env['TEST_DB'] === 'mssql' ? 3 : 6,
			},
		},
		environment: './setup/environment.ts',
		sequence: {
			sequencer: Sequencer,
		},
		testTimeout: 15_000,
	},
});
