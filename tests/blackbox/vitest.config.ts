import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';
import Sequencer from './setup/sequencer';

// mssql is the slowest vendor per query and runs as a single instance, so the full suite's parallel
// forks saturate it and individual ops cross the default timeout. The CI matrix runs one vendor per
// job (TEST_DB), so cut its concurrency and give it more timeout headroom without slowing the others.
const isMssql = (process.env['TEST_DB']?.split(',').map((v) => v.trim()) ?? []).includes('mssql');

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		poolOptions: {
			forks: {
				minForks: 1,
				maxForks: isMssql ? 3 : 6,
			},
		},
		environment: './setup/environment.ts',
		sequence: {
			sequencer: Sequencer,
		},
		testTimeout: isMssql ? 30_000 : 15_000,
	},
});
