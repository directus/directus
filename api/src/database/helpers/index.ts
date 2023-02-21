import { SchemaOverview } from '@directus/shared/types';
import { Knex } from 'knex';
import { getDatabaseClient, getDatabaseVersion } from '..';
import { JsonFieldNode } from '../../types';

import * as dateHelpers from './date';
import * as fnHelpers from './fn';
import * as geometryHelpers from './geometry';
import * as schemaHelpers from './schema';
import * as jsonHelpers from './json';
import { DatabaseVersionedClients } from './json/types';
import { DatabaseClient } from '../../types/database';

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
export type AnyJsonHelper =
	| jsonHelpers.fallback
	| jsonHelpers.sqlite
	| jsonHelpers.mssql13
	| jsonHelpers.mariadb
	| jsonHelpers.mysql8
	| jsonHelpers.mysql5
	| jsonHelpers.oracle12
	| jsonHelpers.postgres12;

export function getJsonHelper(database: Knex, schema: SchemaOverview, nodes: JsonFieldNode[] = []): AnyJsonHelper {
	const client = getDatabaseClient(database);
	const helper = getJsonHelperByVersion(client);
	return new jsonHelpers[helper](database, schema, nodes);
}

export function getJsonHelperByVersion(client: DatabaseClient): DatabaseVersionedClients {
	if (!getDatabaseVersion) return 'fallback'; // happens during unit tests
	const { parsed, full } = getDatabaseVersion();
	if (!parsed || parsed.length === 0) return 'fallback';
	const [major, minor = 0] = parsed;
	switch (client) {
		case 'sqlite':
			if (major === 3 && minor >= 38) {
				return 'sqlite'; // version 3.38.0+
			}
			return 'fallback';
		case 'postgres':
			if (major >= 12) {
				return 'postgres12'; // version 12+
			}
			return 'fallback';
		case 'mysql':
			if (/MariaDB/i.test(full)) {
				if (major == 10 && minor >= 2) {
					return 'mariadb'; // version: 10.2+
				}
				return 'fallback';
			}
			if (major >= 8) {
				return 'mysql8'; // version 8.0+
			}
			if (major === 5 && minor >= 7) {
				// not specifically checking for older builds of 5.7
				return 'mysql5'; // version 5.7+
			}
			return 'fallback';
		case 'oracle':
			if ((major == 12 && minor >= 2) || major > 12) {
				return 'oracle12'; // version 12c+
			}
			return 'fallback';
		case 'mssql':
			if (major >= 13) {
				return 'mssql13'; // version 2016+
			}
			return 'fallback';
		case 'cockroachdb':
			// falling back to postprocessing for cockroachdb
			return 'fallback';
		default:
			// shouldnt get here but always use fallback just in case
			return 'fallback';
	}
}
