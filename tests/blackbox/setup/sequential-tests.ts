// Tests will run sequentially according to this list
export const sequentialTestsList: SequentialTestsList = {
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
		{ testFilePath: '/websocket/auth.test.ts' },
		{ testFilePath: '/websocket/general.test.ts' },
		{ testFilePath: '/flows/schedule-hook.test.ts' },
		{ testFilePath: '/logger/redact.test.ts' },
		{ testFilePath: '/routes/permissions/cache-purge.test.ts' },
		{ testFilePath: '/routes/flows/webhook.test.ts' },
		{ testFilePath: '/app/cache.test.ts' },
		{ testFilePath: '/routes/collections/schema-cache.test.ts' },
		{ testFilePath: '/routes/assets/concurrency.test.ts' },
	],
	// If specified, only run these tests sequentially
	only: [
		// { testFilePath: '/common/seed-database.test.ts' },
		// { testFilePath: '/common/common.test.ts' },
	],
};

export function getReversedTestIndex(testFilePath: string) {
	if (sequentialTestsList.only.length > 0) {
		for (let index = 0; index < sequentialTestsList.only.length; index++) {
			const onlyTest = sequentialTestsList.only[index];

			if (onlyTest && testFilePath.includes(onlyTest.testFilePath)) {
				return index;
			}
		}
	}

	for (let index = 0; index < sequentialTestsList.before.length; index++) {
		const beforeTest = sequentialTestsList.before[index];

		if (beforeTest && testFilePath.includes(beforeTest.testFilePath)) {
			return index;
		}
	}

	for (let index = 0; index < sequentialTestsList.after.length; index++) {
		const afterTest = sequentialTestsList.after[index];

		if (afterTest && testFilePath.includes(afterTest.testFilePath)) {
			return 0 - sequentialTestsList.after.length + index;
		}
	}

	return sequentialTestsList.before.length;
}

type SequentialTestEntry = {
	testFilePath: string;
};

type SequentialTestsList = {
	before: SequentialTestEntry[];
	after: SequentialTestEntry[];
	only: SequentialTestEntry[];
};
