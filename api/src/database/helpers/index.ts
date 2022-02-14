import { getDatabaseClient } from '..';
import { Knex } from 'knex';

import * as dateHelpers from './date';
import * as geometryHelpers from './geometry';
import * as schemaHelpers from './schema';

export function getHelpers(database: Knex) {
	const client = getDatabaseClient(database);
	return {
		date: new dateHelpers[client](database),
		st: new geometryHelpers[client](database),
		schema: new schemaHelpers[client](database),
	};
}

export type Helpers = ReturnType<typeof getHelpers>;
