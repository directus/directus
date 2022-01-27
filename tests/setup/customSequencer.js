const Sequencer = require('@jest/test-sequencer').default;
const findIndex = require('lodash').findIndex;
const sequentialTestsList = require('./sequentialTests.js').list;

class CustomSequencer extends Sequencer {
	async sort(tests) {
		const sortedTests = Array.from(tests);

		if (sortedTests.length > 1) {
			for (let sequentialTest of sequentialTestsList) {
				const testIndex = findIndex(sortedTests, (test) => {
					return String(test.path).endsWith(sequentialTest.testFilePath);
				});

				if (testIndex !== -1) {
					sortedTests.push(sortedTests.splice(testIndex, 1)[0]);
				}
			}
		}

		process.env.totalTestsCount = String(tests.length);

		return sortedTests;
	}
}

module.exports = CustomSequencer;
