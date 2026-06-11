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

		while (testIndex !== 0) {
			try {
				const response = await axios.get(`${serverUrl}/items/tests_flow_completed`, {
					params: {
						'aggregate[count]': 'id',
					},
					headers: {
						Authorization: `Bearer ${USER.TESTS_FLOW.TOKEN}`,
					},
				});

				const completedCount = Number(response.data.data[0].count.id);

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

			await sleep(1000);
		}

		return {
			async teardown() {
				const body = {
					test_file_path: testFilePath,
				};

				// A lost completion post stalls every file gated behind this one for the rest of the run,
				// cascading into mass skips. Retry a few times before giving up so a transient hiccup
				// (likely on a loaded mssql) doesn't drop this file out of the count.
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
