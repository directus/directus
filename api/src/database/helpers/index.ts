import { getDatabaseClient } from '..';
import { Knex } from 'knex';

import * as dateHelpers from './date';
import * as geometryHelpers from './geometry';
import * as migrationHelpers from './migration';

export function getHelpers(database: Knex) {
	const client = getDatabaseClient(database);
	return {
		date: new dateHelpers[client](database),
		st: new geometryHelpers[client](database),
		migration: new migrationHelpers[client](database),
	};
}

export type Helpers = ReturnType<typeof getHelpers>;
