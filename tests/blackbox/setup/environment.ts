import fs from 'node:fs/promises';
import axios from 'axios';
import type { Environment } from 'vitest';
import { USER } from '../common/variables';
import { sleep } from '../utils/sleep';
import { getReversedTestIndex } from './sequential-tests';

// Auth tests that can run independently without waiting for schema setup tests
const SKIP_SEQUENCING_PATTERNS = ['/routes/auth/ldap', '/routes/auth/saml', '/routes/auth/oauth'];

export default <Environment>{
	name: 'custom',
	transformMode: 'ssr',

	async setup(global) {
		const { totalTestsCount } = JSON.parse(await fs.readFile('sequencer-data.json', 'utf8'));
		const testFilePath = global.__vitest_worker__.ctx.files[0].split('blackbox')[1];
		const serverUrl = process.env['serverUrl'];

		// Skip sequencing for auth tests that don't depend on schema changes
		const skipSequencing = SKIP_SEQUENCING_PATTERNS.some((pattern) => testFilePath?.includes(pattern));

		if (!serverUrl || isNaN(totalTestsCount)) {
			throw 'Missing flow env variables';
		}

		const testIndex = getReversedTestIndex(testFilePath, global.__vitest_worker__.ctx.config.name);

		while (testIndex !== 0 && !skipSequencing) {
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
				} else if (totalTestsCount + testIndex === completedCount) {
					break;
				}
			} catch {
				continue;
			}

			await sleep(1000);
		}

		return {
			async teardown() {
				// Skip teardown for auth tests that don't participate in sequencing
				if (skipSequencing) return;

				const body = {
					test_file_path: testFilePath,
				};

				await axios.post(`${serverUrl}/items/tests_flow_completed`, body, {
					headers: {
						Authorization: `Bearer ${USER.TESTS_FLOW.TOKEN}`,
						'Content-Type': 'application/json',
					},
				});
			},
		};
	},
};
