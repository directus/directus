# Working on Blackbox Tests

> The testing suite is located in `/tests/blackbox`. For details on running tests, please refer to
> [Running Tests](/contributing/tests#running-blackbox-tests).

---

- Every API route should have a test to verify that it is working as intended.
- The tests are TypeScript files with names ending in `.test.ts`.
- Tests can have accompanying seed files ending in `.seed.ts`. Seed files contain the database schema, types and seed
  functions. Tests should be located in a relevant folder as listed below.

## Folder Structure

| Directory     | Contents                         | Import Path |
| :------------ | :------------------------------- | :---------- |
| `/common`     | Core testing functions and tests | `@common/*` |
| `/query`      | Tests for global query filter    | `@query/*`  |
| `/middleware` | Tests for middleware             | -           |
| `/routes`     | Tests for the all API routes     | -           |
| `/schema`     | Tests for specific schema types  | `@schema/*` |
| `/setup`      | Migrations and setup scripts     | -           |
| `/utils`      | Utility functions                | `@utils/*`  |

## Tests Flow

1. Bootstrap and start servers.
2. Set up test data flow for sequential tests.
3. Run the `before` tests sequentially.
   - Database seeding, common tests and other collection / field tests.
4. Run the other unspecified tests concurrently.
5. Run the `after` tests sequentially.
   - Tests that require changes to the environment variables.
6. Teardown servers.

## Sample Seed File

1. Seed file exports the following:
   - Table names
   - Types for the items
   - `getTestsSchema()` for schema specifications.
   - `seedDBStructure()` which runs automatically.
   - `seedDBValues()` called in the test to seed values into the database.
2. The `possibleValues` can be generated using `SeedFunctions` or be populated manually.
3. `seedDBStructure()` should clear the existing tables prior to recreating it.
4. `seedDBValues()` can be tweaked to return values if necessary.

```ts
import vendors from '@common/get-dbs-to-test';
import {
	CreateCollection,
	CreateField,
	CreateItem,
	DeleteCollection,
	SeedFunctions,
	PrimaryKeyType,
	PRIMARY_KEY_TYPES,
} from '@common/index';
import { CachedTestsSchema, TestsSchema } from '@query/filter';
export const collectionCountries = 'test_items_sample_countries';
export type Country = {
	id?: number | string;
	name: string;
};
export function getTestsSchema(pkType: PrimaryKeyType, seed?: string): TestsSchema {
	const schema: TestsSchema = {
		[`${collectionCountries}_${pkType}`]: {
			id: {
				field: 'id',
				type: pkType,
				isPrimaryKey: true,
				filters: true,
				possibleValues: SeedFunctions.generatePrimaryKeys(pkType, {
					quantity: 2,
					seed: `${collectionCountries}${seed}`,
					incremental: true,
				}),
			},
			name: {
				field: 'name',
				type: 'string',
				filters: true,
				possibleValues: ['United States', 'Malaysia'],
			},
		},
	};
	return schema;
}
export const seedDBStructure = () => {
	it.each(vendors)(
		'%s',
		async (vendor) => {
			for (const pkType of PRIMARY_KEY_TYPES) {
				try {
					const localCollectionCountries = `${collectionCountries}_${pkType}`;
					// Delete existing collections
					await DeleteCollection(vendor, { collection: localCollectionCountries });
					// Create countries collection
					await CreateCollection(vendor, {
						collection: localCollectionCountries,
						primaryKeyType: pkType,
					});
					await CreateField(vendor, {
						collection: localCollectionCountries,
						field: 'name',
						type: 'string',
					});
					expect(true).toBeTruthy();
				} catch (error) {
					expect(error).toBeFalsy();
				}
			}
		},
		300000
	);
};
export const seedDBValues = async (cachedSchema: CachedTestsSchema) => {
	try {
		await Promise.all(
			vendors.map(async (vendor) => {
				for (const pkType of PRIMARY_KEY_TYPES) {
					const schema = cachedSchema[pkType];
					const localCollectionCountries = `${collectionCountries}_${pkType}`;
					// Create countries
					const itemCountries = [];
					for (let i = 0; i < schema[localCollectionCountries].id.possibleValues.length; i++) {
						const country: Country = {
							name: schema[localCollectionCountries].name.possibleValues[i],
						};
						if (pkType === 'string') {
							country.id = schema[localCollectionCountries].id.possibleValues[i];
						}
						itemCountries.push(country);
					}
					await CreateItem(vendor, {
						collection: localCollectionCountries,
						item: itemCountries,
					});
				}
			})
		);
		return true;
	} catch (err) {
		return false;
	}
};
```

## Sample Test File

1. Values are seeded into the database before the tests run.
2. Tests within are pre-populated and run sequentially.
3. `seedDBStructure()` should clear the existing tables prior to recreating it.
4. `seedDBValues()` should be updated to return values if required.

```ts
import request from 'supertest';
import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { CachedTestsSchema } from '@query/filter';
import * as common from '@common/index';
import { collectionCountries, getTestsSchema, seedDBValues } from './sample.seed';
const cachedSchema = common.PRIMARY_KEY_TYPES.reduce((acc, pkType) => {
	acc[pkType] = getTestsSchema(pkType);
	return acc;
}, {} as CachedTestsSchema);
let isSeeded = false;
beforeAll(async () => {
	isSeeded = await seedDBValues(cachedSchema);
}, 300000);
describe('Seed Database Values', () => {
	expect(isSeeded).toStrictEqual(true);
});
describe.each(common.PRIMARY_KEY_TYPES)('/items', (pkType) => {
	const localCollectionCountries = `${collectionCountries}_${pkType}`;
	describe(`pkType: ${pkType}`, () => {
		describe('GET /:collection/:id', () => {
			describe('returns the selected country only', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const countryId = 123123;
					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionCountries}/${countryId}`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);
					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data.id).toStrictEqual(countryId);
				});
			});
		});
	});
});
```

## Set Sequential Flow

Tests can be set to run sequentially in `tests/blackbox/setup/sequentialTests.js`. Sequential tests should be added to
`before` except those that changes the environment variables, which should be added to `after`. To speed up the testing
of newly written tests, the test can be added to `only`, where only tests within this array will run.
`seed-database.test.ts` and `common.test.ts` are compulsory for the common functions to be used.
