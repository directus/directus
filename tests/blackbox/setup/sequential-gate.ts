import fs from 'node:fs/promises';
import axios from 'axios';
import { beforeAll } from 'vitest';
import { USER } from '../common/variables';
import { sleep } from '../utils/sleep';
import { getReversedTestIndex } from './sequential-tests';

/**
 * Enforces sequential ordering of certain test files across parallel forks.
 *
 * Vitest 4 removed any connection between a custom `Environment` and the test
 * file being run, so the gating that previously lived in `setup/environment.ts`
 * now runs as a `setupFiles` hook. `beforeAll` exposes the current file via its
 * context, and the project name comes from the `TEST_PROJECT` env set per project
 * in `vitest.config.ts`.
 */
// eslint-disable-next-line no-empty-pattern
beforeAll(async ({}, suite) => {
	const { totalTestsCount } = JSON.parse(await fs.readFile('sequencer-data.json', 'utf8'));
	const testFilePath = suite.file?.filepath.split('blackbox')[1];
	const serverUrl = process.env['serverUrl'];
	const project = process.env['TEST_PROJECT'] as 'db' | 'common';

	if (!serverUrl || !testFilePath || isNaN(totalTestsCount)) {
		throw 'Missing flow env variables';
	}

	const testIndex = getReversedTestIndex(testFilePath, project);

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
			} else if (totalTestsCount + testIndex === completedCount) {
				break;
			}
		} catch {
			continue;
		}

		await sleep(1000);
	}

	return async () => {
		await axios.post(
			`${serverUrl}/items/tests_flow_completed`,
			{ test_file_path: testFilePath },
			{
				headers: {
					Authorization: `Bearer ${USER.TESTS_FLOW.TOKEN}`,
					'Content-Type': 'application/json',
				},
			},
		);
	};
});
