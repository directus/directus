import { findIndex } from 'lodash-es';
import fs from 'node:fs/promises';
import { BaseSequencer, type WorkspaceSpec } from 'vitest/node';
import { sequentialTestsList } from './sequential-tests';

export default class CustomSequencer extends BaseSequencer {
	override async sort(files: WorkspaceSpec[]) {
		if (files.length > 1) {
			// If specified, only run these tests sequentially
			if (sequentialTestsList.only.length > 0) {
				const onlyTests = [];

				for (const sequentialTest of sequentialTestsList.only) {
					const testIndex = findIndex(files, ([_, testFile]) => {
						return testFile.endsWith(sequentialTest);
					});

					if (testIndex !== -1) {
						const test = files[testIndex];

						if (test) {
							onlyTests.push(test);
						}
					}
				}

				files = onlyTests;
			} else {
				for (const sequentialTest of sequentialTestsList.before.slice().reverse()) {
					const testIndex = findIndex(files, ([_, testFile]) => {
						return testFile.endsWith(sequentialTest);
					});

					if (testIndex !== -1) {
						const test = files.splice(testIndex, 1)[0];

						if (test) {
							files.unshift(test);
						}
					}
				}

				for (const sequentialTest of sequentialTestsList.after) {
					const testIndex = findIndex(files, ([_, testFile]) => {
						return testFile.endsWith(sequentialTest);
					});

					if (testIndex !== -1) {
						const test = files.splice(testIndex, 1)[0];

						if (test) {
							files.push(test);
						}
					}
				}
			}
		}

		// Expose sequencer data to setup & tests
		await fs.writeFile('sequencer-data.json', JSON.stringify({ totalTestsCount: files.length }));

		return files;
	}
}
