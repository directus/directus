// Tests will run sequentially according to this list
exports.list = [
	{ testFilePath: '/api/schema/datetime.test.ts' },
	{ testFilePath: '/api/schema/datetime-changed-node-tz-america.test.ts' },
	{ testFilePath: '/api/schema/datetime-changed-node-tz-asia.test.ts' },
];

exports.getReversedTestIndex = function (testFilePath) {
	for (let index = 0; index < this.list.length; index++) {
		if (testFilePath.includes(this.list[index].testFilePath)) {
			return 0 - this.list.length + index;
		}
	}
	return 0;
};
