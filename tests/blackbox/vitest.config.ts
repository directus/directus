import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';
import Sequencer from './setup/sequencer';

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		globalSetup: './setup/setup.ts',
		environment: 'blackbox',
		sequence: {
			sequencer: Sequencer,
		},
		testTimeout: 15_000,
	},
});
