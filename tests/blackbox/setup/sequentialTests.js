// Tests will run sequentially according to this list
exports.list = {
	before: [
		{ testFilePath: '/common/seed-database.test.ts' },
		{ testFilePath: '/common/common.test.ts' },
		{ testFilePath: '/routes/schema/schema.test.ts' },
		{ testFilePath: '/routes/collections/crud.test.ts' },
		{ testFilePath: '/routes/fields/change-fields.test.ts' },
	],
	after: [
		{ testFilePath: '/schema/timezone/timezone.test.ts' },
		{ testFilePath: '/schema/timezone/timezone-changed-node-tz-america.test.ts' },
		{ testFilePath: '/schema/timezone/timezone-changed-node-tz-asia.test.ts' },
		{ testFilePath: '/logger/redact.test.ts' },
		{ testFilePath: '/routes/permissions/cache-purge.test.ts' },
		{ testFilePath: '/routes/flows/webhook.test.ts' },
		{ testFilePath: '/routes/collections/schema-cache.test.ts' },
		{ testFilePath: '/routes/assets/concurrency.test.ts' },
	],
	// If specified, only run these tests sequentially
	only: [
		// { testFilePath: '/common/seed-database.test.ts' },
		// { testFilePath: '/common/common.test.ts' },
	],
};

exports.getReversedTestIndex = function (testFilePath) {
	if (this.list.only.length > 0) {
		for (let index = 0; index < this.list.only.length; index++) {
			if (testFilePath.includes(this.list.only[index].testFilePath)) {
				return index;
			}
		}
	}

	for (let index = 0; index < this.list.before.length; index++) {
		if (testFilePath.includes(this.list.before[index].testFilePath)) {
			return index;
		}
	}

	for (let index = 0; index < this.list.after.length; index++) {
		if (testFilePath.includes(this.list.after[index].testFilePath)) {
			return 0 - this.list.after.length + index;
		}
	}

	return this.list.before.length;
};
