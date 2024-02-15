import { findIndex } from 'lodash-es';
import fs from 'node:fs/promises';
import { BaseSequencer, type WorkspaceSpec } from 'vitest/node';
import { sequentialTestsList } from './sequential-tests';

export default class CustomSequencer extends BaseSequencer {
	override async sort(files: WorkspaceSpec[]) {
		if (files.length > 1) {
			const list = sequentialTestsList[files[0]![0].config.name as 'db' | 'common'];

			// If specified, only run these tests sequentially
			if (list.only.length > 0) {
				const onlyTests = [];

				for (const sequentialTest of list.only) {
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
				for (const sequentialTest of list.before.slice().reverse()) {
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

				for (const sequentialTest of list.after) {
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
