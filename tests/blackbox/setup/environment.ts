import fs from 'node:fs/promises';
import axios from 'axios';
import type { Environment } from 'vitest/environments';
import { USER } from '../common/variables';
import { sleep } from '../utils/sleep';
import { getReversedTestIndex } from './sequential-tests';

export default <Environment>{
	name: 'custom',
	transformMode: 'ssr',

	async setup(global) {
		// Local debugging escape hatch: skip the sequential gate entirely so a single file can be run
		// in isolation. The gate only exists to serialize schema-mutating files when many run
		// concurrently; a lone file has no such races, so the gate is pure deadlock waiting for
		// predecessor files that never run. Never set in CI.
		if (process.env['BLACKBOX_NO_GATE']) {
			return { teardown() {} };
		}

		const { totalTestsCount } = JSON.parse(await fs.readFile('sequencer-data.json', 'utf8'));
		const testFilePath = global.__vitest_worker__.ctx.files[0].filepath.split('blackbox')[1];
		const serverUrl = process.env['serverUrl'];

		if (!serverUrl || isNaN(totalTestsCount)) {
			throw 'Missing flow env variables';
		}

		const testIndex = getReversedTestIndex(testFilePath, global.__vitest_worker__.ctx.config.name);

		// Backstop so a missing completion can't hang this file's setup until the CI job is killed at
		// 60min. Completions are posted from the reporter (see setup/reporter.ts) and, as a fallback,
		// from teardown below; both retry. But if the count still never reaches this file's threshold
		// (e.g. a worker died before either could post), proceed once the count has stopped advancing
		// for longer than the slowest file could legitimately take, rather than wait forever. The file
		// still runs and still posts, so a single stall does not cascade.
		const GATE_STALL_TIMEOUT = 8 * 60 * 1000;
		const GATE_MAX_WAIT = 20 * 60 * 1000;
		const gateStart = Date.now();
		let lastCount = -1;
		let lastProgress = gateStart;

		while (testIndex !== 0) {
			try {
				const response = await axios.get(`${serverUrl}/items/tests_flow_completed`, {
					params: {
						// DISTINCT so the reporter and the teardown fallback posting the same file count once.
						'aggregate[countDistinct]': 'test_file_path',
					},
					headers: {
						Authorization: `Bearer ${USER.TESTS_FLOW.TOKEN}`,
					},
				});

				const completedCount = Number(response.data.data[0].countDistinct.test_file_path);

				if (completedCount > lastCount) {
					lastCount = completedCount;
					lastProgress = Date.now();
				}

				if (testIndex >= 0) {
					if (completedCount >= testIndex) break;
				} else if (completedCount >= totalTestsCount + testIndex) {
					// `>=` (not `===`): under parallel completion the count can step past this file's slot
					// between polls, and an exact match would then wait out the whole run.
					break;
				}
			} catch {
				// Server momentarily unreachable/busy. Fall through to the back-off below rather than
				// `continue`-ing, which would skip the sleep and hot-loop requests onto a busy server.
			}

			const now = Date.now();

			if (now - lastProgress > GATE_STALL_TIMEOUT || now - gateStart > GATE_MAX_WAIT) {
				const needed = testIndex >= 0 ? testIndex : totalTestsCount + testIndex;

				// eslint-disable-next-line no-console
				console.warn(
					`[gate] proceeding with "${testFilePath}" after ${Math.round((now - gateStart) / 1000)}s ` +
						`(completed ${lastCount}, needed ${needed}); a completion was likely lost`,
				);

				break;
			}

			await sleep(1000);
		}

		return {
			async teardown() {
				const body = {
					test_file_path: testFilePath,
				};

				// Fallback to the reporter's completion post (see setup/reporter.ts); the gate counts
				// DISTINCT paths so posting from both is harmless. Retry a few times so a transient hiccup
				// (likely on a loaded mssql) doesn't drop this file out of the count if the reporter also
				// missed it.
				for (let attempt = 0; attempt < 5; attempt++) {
					try {
						await axios.post(`${serverUrl}/items/tests_flow_completed`, body, {
							headers: {
								Authorization: `Bearer ${USER.TESTS_FLOW.TOKEN}`,
								'Content-Type': 'application/json',
							},
						});

						return;
					} catch {
						await sleep(1000);
					}
				}
			},
		};
	},
};
