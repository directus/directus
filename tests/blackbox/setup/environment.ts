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
		const { totalTestsCount } = JSON.parse(await fs.readFile('sequencer-data.json', 'utf8'));
		const testFilePath = global.__vitest_worker__.ctx.files[0].filepath.split('blackbox')[1];
		const serverUrl = process.env['serverUrl'];

		if (!serverUrl || isNaN(totalTestsCount)) {
			throw 'Missing flow env variables';
		}

		const testIndex = getReversedTestIndex(testFilePath, global.__vitest_worker__.ctx.config.name);

		// Backstop against a lost completion (a worker OOM-killed before teardown, or a teardown POST that
		// failed every retry on a loaded server) which otherwise leaves the count permanently short and
		// hangs every gated file until the 60min CI kill.
		const GATE_STALL_MS = Number(process.env['BLACKBOX_GATE_STALL_MS']) || 5 * 60 * 1000;
		const authHeader = { Authorization: `Bearer ${USER.TESTS_FLOW.TOKEN}` };
		let lastCount = -1;
		let lastProgressMs = Date.now();

		const isGateTripped = async () => {
			try {
				const res = await axios.get(`${serverUrl}/items/tests_flow_data`, {
					params: { fields: 'gate_tripped', limit: 1 },
					headers: authHeader,
				});

				return Boolean(res.data.data[0]?.gate_tripped);
			} catch {
				return false;
			}
		};

		const tripGate = async () => {
			try {
				const res = await axios.get(`${serverUrl}/items/tests_flow_data`, {
					params: { fields: 'id', limit: 1 },
					headers: authHeader,
				});

				const id = res.data.data[0]?.id;

				if (id !== undefined) {
					await axios.patch(
						`${serverUrl}/items/tests_flow_data/${id}`,
						{ gate_tripped: true },
						{ headers: { ...authHeader, 'Content-Type': 'application/json' } },
					);
				}
			} catch {
				// Best-effort: if this fails, this file still proceeds and others fall back to their own backstop.
			}
		};

		while (testIndex !== 0) {
			try {
				const response = await axios.get(`${serverUrl}/items/tests_flow_completed`, {
					params: {
						'aggregate[count]': 'id',
					},
					headers: authHeader,
				});

				const completedCount = Number(response.data.data[0].count.id);

				if (completedCount > lastCount) {
					lastCount = completedCount;
					lastProgressMs = Date.now();
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

			// Only act once the suite is flowing (count > 0): at count 0 the count is legitimately frozen
			// for minutes while seed-database (the first, ungated file) runs, and the flag can't be set yet.
			if (lastCount > 0) {
				if (await isGateTripped()) {
					// eslint-disable-next-line no-console
					console.warn(`[gate] "${testFilePath}" proceeding: gate degraded by an earlier lost completion`);
					break;
				}

				if (Date.now() - lastProgressMs > GATE_STALL_MS) {
					// eslint-disable-next-line no-console
					console.warn(
						`[gate] "${testFilePath}" proceeding after ${Math.round((Date.now() - lastProgressMs) / 1000)}s ` +
							`with completion count stuck at ${lastCount} — a completion was lost; degrading gate`,
					);

					await tripGate();
					break;
				}
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
				// doesn't drop this file out of the count.
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
