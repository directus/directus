const Sequencer = require('@jest/test-sequencer').default;
const findIndex = require('lodash').findIndex;
const sequentialTestsList = require('./sequentialTests.js').list;

class CustomSequencer extends Sequencer {
	async sort(tests) {
		let sortedTests = Array.from(tests);

		if (sortedTests.length > 1) {
			// If specified, only run these tests sequentially
			if (sequentialTestsList.only.length > 0) {
				let onlyTests = [];

				for (let sequentialTest of sequentialTestsList.only) {
					const testIndex = findIndex(sortedTests, (test) => {
						return String(test.path).endsWith(sequentialTest.testFilePath);
					});

					if (testIndex !== -1) {
						onlyTests.push(sortedTests[testIndex]);
					}
				}

				sortedTests = onlyTests;
			} else {
				for (let sequentialTest of sequentialTestsList.before.slice().reverse()) {
					const testIndex = findIndex(sortedTests, (test) => {
						return String(test.path).endsWith(sequentialTest.testFilePath);
					});

					if (testIndex !== -1) {
						sortedTests.unshift(sortedTests.splice(testIndex, 1)[0]);
					}
				}

				for (let sequentialTest of sequentialTestsList.after) {
					const testIndex = findIndex(sortedTests, (test) => {
						return String(test.path).endsWith(sequentialTest.testFilePath);
					});

					if (testIndex !== -1) {
						sortedTests.push(sortedTests.splice(testIndex, 1)[0]);
					}
				}
			}
		}

		process.env.totalTestsCount = String(sortedTests.length);

		return sortedTests;
	}
}

module.exports = CustomSequencer;
