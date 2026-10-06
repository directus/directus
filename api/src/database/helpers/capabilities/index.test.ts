import type { Knex } from 'knex';
import { expect, test } from 'vitest';
import * as capabilitiesHelpers from './index.js';

test.each([
	['postgres', 65535],
	['redshift', 65535],
	['cockroachdb', 65535],
	['oracle', 1000],
	['mysql', Infinity],
	['mssql', 2100],
	['sqlite', 32766],
] as const)('maxInListSize for %s is %d', (client, expected) => {
	const helper = new capabilitiesHelpers[client]({} as Knex);

	expect(helper.maxInListSize()).toBe(expected);
});
