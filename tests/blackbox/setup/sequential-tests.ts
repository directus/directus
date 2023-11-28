// Tests will run sequentially according to this list
export const sequentialTestsList: SequentialTestsList = {
	before: [
		'/common/seed-database.test.ts',
		'/common/common.test.ts',
		'/routes/schema/schema.test.ts',
		'/routes/collections/crud.test.ts',
		'/routes/fields/change-fields.test.ts',
	],
	after: [
		'/schema/timezone/timezone.test.ts',
		'/schema/timezone/timezone-changed-node-tz-america.test.ts',
		'/schema/timezone/timezone-changed-node-tz-asia.test.ts',
		'/websocket/auth.test.ts',
		'/websocket/general.test.ts',
		'/flows/schedule-hook.test.ts',
		'/logger/redact.test.ts',
		'/routes/permissions/cache-purge.test.ts',
		'/routes/flows/webhook.test.ts',
		'/app/cache.test.ts',
		'/routes/collections/schema-cache.test.ts',
		'/routes/assets/concurrency.test.ts',
	],
	// If specified, only run these tests sequentially
	only: [
		// '/common/seed-database.test.ts',
		// '/common/common.test.ts',
	],
};

export function getReversedTestIndex(testFilePath: string) {
	if (sequentialTestsList.only.length > 0) {
		for (let index = 0; index < sequentialTestsList.only.length; index++) {
			const onlyTest = sequentialTestsList.only[index];

			if (onlyTest && testFilePath.includes(onlyTest)) {
				return index;
			}
		}
	}

	for (let index = 0; index < sequentialTestsList.before.length; index++) {
		const beforeTest = sequentialTestsList.before[index];

		if (beforeTest && testFilePath.includes(beforeTest)) {
			return index;
		}
	}

	for (let index = 0; index < sequentialTestsList.after.length; index++) {
		const afterTest = sequentialTestsList.after[index];

		if (afterTest && testFilePath.includes(afterTest)) {
			return 0 - sequentialTestsList.after.length + index;
		}
	}

	return sequentialTestsList.before.length;
}

type SequentialTestsList = {
	before: string[];
	after: string[];
	only: string[];
};
