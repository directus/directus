import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';
import Sequencer from './setup/sequencer';

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		poolOptions: {
			forks: {
				minForks: 1,
				// Reduced from 6: under higher parallelism the single mssql instance saturates, making
				// server queries cross their request timeout and poison pooled connections, which
				// cascades into suite-wide failures. Lower this further (2/1) if mssql still saturates.
				maxForks: 3,
			},
		},
		environment: './setup/environment.ts',
		sequence: {
			sequencer: Sequencer,
		},
		testTimeout: 15_000,
	},
});
