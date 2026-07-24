import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';
import Sequencer from './setup/sequencer';

const isMssql = (process.env['TEST_DB']?.split(',').map((v) => v.trim()) ?? []).includes('mssql');

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		poolOptions: {
			forks: {
				minForks: 1,
				maxForks: isMssql ? 2 : 6,
			},
		},
		environment: './setup/environment.ts',
		sequence: {
			sequencer: Sequencer,
		},
		testTimeout: isMssql ? 75_000 : 45_000,
	},
});
