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
				// 2 for mssql: on a 4-vCPU runner the vitest workers compete with two Directus servers +
				// mssql + redis/minio for cores, and the timing-sensitive websocket collab tests get
				// starved and miss their message-wait deadlines. Fewer workers leaves CPU for the server.
				maxForks: isMssql ? 2 : 6,
			},
		},
		environment: './setup/environment.ts',
		sequence: {
			sequencer: Sequencer,
		},
		// 45s for mssql so the 30s message-wait ceiling (see waitForMatchingMessage) fits inside the
		// test timeout, rather than the test timeout firing first and masking it.
		testTimeout: isMssql ? 45_000 : 15_000,
	},
});
