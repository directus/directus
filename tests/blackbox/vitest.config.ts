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
		// The test timeout must sit ABOVE the websocket message-wait ceiling (see waitForMatchingMessage:
		// 60s on mssql, 30s elsewhere) plus headroom for the heavy collab tests' own setup (permission/
		// relation queries) before the wait even starts — otherwise the test timeout fires first and the
		// failure reports as a generic test timeout instead of a message timeout. The collab message does
		// arrive under CI contention, just late, so this only slows genuine failures. mssql gets the most
		// (single starved instance on a 4-vCPU runner); other vendors clear their 30s ceiling with room.
		testTimeout: isMssql ? 75_000 : 45_000,
	},
});
