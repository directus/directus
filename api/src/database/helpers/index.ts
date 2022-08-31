import { SchemaOverview } from '@directus/shared/types';
import { Knex } from 'knex';
import { getDatabaseClient } from '..';

import * as dateHelpers from './date';
import * as fnHelpers from './fn';
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

export function getFunctions(database: Knex, schema: SchemaOverview) {
	const client = getDatabaseClient(database);
	return new fnHelpers[client](database, schema);
}

export type Helpers = ReturnType<typeof getHelpers>;
