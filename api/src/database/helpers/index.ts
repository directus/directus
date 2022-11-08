import { SchemaOverview } from '@directus/shared/types';
import { Knex } from 'knex';
import { getDatabaseClient } from '..';
import { JsonFieldNode } from '../../types';

import * as dateHelpers from './date';
import * as fnHelpers from './fn';
import * as geometryHelpers from './geometry';
import * as schemaHelpers from './schema';
import * as jsonHelpers from './json';
import { DatabaseClients } from './types';

export function getHelpers(database: Knex) {
	const client = getDatabaseClient(database);

	return {
		date: new dateHelpers[client](database),
		st: new geometryHelpers[client](database),
		schema: new schemaHelpers[client](database),
	};
}

export function getJsonHelper(database: Knex, schema: SchemaOverview, nodes: JsonFieldNode[] = []) {
	const client = getDatabaseClient(database);
	return new jsonHelpers[client](database, schema, nodes);
}

export function checkJsonSupport(client: DatabaseClients, version: string, fullVersion = ''): boolean {
	return jsonHelpers[client].isSupported(version, fullVersion);
}

export function getFunctions(database: Knex, schema: SchemaOverview) {
	const client = getDatabaseClient(database);
	return new fnHelpers[client](database, schema);
}

export type Helpers = ReturnType<typeof getHelpers>;
