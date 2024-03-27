import type { SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { getDatabaseClient } from '../index.js';

import * as dateHelpers from './date/index.js';
import * as fnHelpers from './fn/index.js';
import * as geometryHelpers from './geometry/index.js';
import * as schemaHelpers from './schema/index.js';
import * as sequenceHelpers from './sequence/index.js';

export function getHelpers(database: Knex) {
	const client = getDatabaseClient(database);

	return {
		date: new dateHelpers[client](database),
		st: new geometryHelpers[client](database),
		schema: new schemaHelpers[client](database),
		sequence: new sequenceHelpers[client](database),
	};
}

export function getFunctions(database: Knex, schema: SchemaOverview) {
	const client = getDatabaseClient(database);
	return new fnHelpers[client](database, schema);
}

export type Helpers = ReturnType<typeof getHelpers>;
