import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';
import Sequencer from './setup/sequencer';

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		pool: 'forks',
		poolOptions: {
			forks: {
				minForks: 1,
				maxForks: 6,
			},
		},
		environment: './setup/environment.ts',
		sequence: {
			sequencer: Sequencer,
		},
		testTimeout: 15_000,
		reporters: process.env['GITHUB_ACTIONS'] ? ['hanging-process', 'github-actions'] : ['default', 'hanging-process'],
	},
});
