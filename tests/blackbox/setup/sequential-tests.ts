// Tests will run sequentially according to this list
export const sequentialTestsList: Record<'db' | 'common', SequentialTestsList> = {
	common: {
		before: ['/common/common.test.ts'],
		after: [],
		// If specified, only run these tests sequentially
		only: [
			// '/common/common.test.ts',
		],
	},
	db: {
		before: [
			'/tests/db/seed-database.test.ts',
			'/common/common.test.ts',
			'/tests/db/routes/schema/schema.test.ts',
			'/tests/db/routes/collections/crud.test.ts',
			'/tests/db/routes/fields/change-fields.test.ts',
			'/tests/db/routes/fields/crud.test.ts',
			'/tests/db/routes/items/version.test.ts',
		],
		after: [
			'/tests/db/websocket/collab/multi-instance.test.ts',
			'/tests/db/schema/timezone/timezone.test.ts',
			'/tests/db/schema/timezone/timezone-changed-node-tz-america.test.ts',
			'/tests/db/schema/timezone/timezone-changed-node-tz-asia.test.ts',
			'/tests/db/websocket/auth.test.ts',
			'/tests/db/websocket/general.test.ts',
			'/tests/db/routes/permissions/cache-purge.test.ts',
			'/tests/db/routes/flows/webhook.test.ts',
			'/tests/db/app/cache.test.ts',
			'/tests/db/routes/collections/schema-cache.test.ts',
		],
		// If specified, only run these tests sequentially
		only: [
			'/tests/db/seed-database.test.ts',
			'/common/common.test.ts',
			'/tests/db/routes/items/field-selection.test.ts',
		],
	},
};

export function getReversedTestIndex(testFilePath: string, project: 'db' | 'common') {
	const list = sequentialTestsList[project];

	if (list.only.length > 0) {
		for (let index = 0; index < list.only.length; index++) {
			const onlyTest = list.only[index];

			if (onlyTest && testFilePath.includes(onlyTest)) {
				return index;
			}
		}
	}

	for (let index = 0; index < list.before.length; index++) {
		const beforeTest = list.before[index];

		if (beforeTest && testFilePath.includes(beforeTest)) {
			return index;
		}
	}

	for (let index = 0; index < list.after.length; index++) {
		const afterTest = list.after[index];

		if (afterTest && testFilePath.includes(afterTest)) {
			return 0 - list.after.length + index;
		}
	}

	return list.before.length;
}

type SequentialTestsList = {
	before: string[];
	after: string[];
	only: string[];
};
