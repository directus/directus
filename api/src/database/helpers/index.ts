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
import { DatabaseClients } from './types';

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
	| jsonHelpers.mssql16
	| jsonHelpers.mssql13
	| jsonHelpers.mariadb
	| jsonHelpers.mysql8
	| jsonHelpers.mysql5
	| jsonHelpers.oracle12
	| jsonHelpers.cockroachdb
	| jsonHelpers.postgres10
	| jsonHelpers.postgres14;

let jsonHelperSingleton: AnyJsonHelper | undefined;
export function getJsonHelper(database: Knex, schema: SchemaOverview, nodes: JsonFieldNode[] = []): AnyJsonHelper {
	if (jsonHelperSingleton) return jsonHelperSingleton;
	const client = getDatabaseClient(database);
	const helper = getJsonHelperByVersion(client);
	jsonHelperSingleton = new jsonHelpers[helper](database, schema, nodes);
	return jsonHelperSingleton;
}

export function getJsonHelperByVersion(client: DatabaseClients): DatabaseVersionedClients {
	const { parsed, full } = getDatabaseVersion();
	if (parsed.length === 0) return 'fallback';
	const [major, minor = 0] = parsed;
	switch (client) {
		case 'sqlite':
			if (major === 3 && minor >= 38) {
				return 'sqlite'; // version 3.38.0+
			}
			return 'fallback'; // might be able to check for json extension
		case 'postgres':
			if (major >= 14) {
				return 'postgres14'; // version 14+
			}
			if (major >= 10) {
				// might be able to support v9 here too
				return 'postgres10'; // version 10+
			}
			return 'fallback';
		case 'cockroachdb':
			if (major >= 2) {
				// apparently cockroach DB supports JSON since v2 but not very well
				return 'cockroachdb';
			}
			return 'fallback'; // should really update if still running < v2
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
			if (major >= 12 && minor >= 2) {
				return 'oracle12'; // version 12c+
			}
			return 'fallback';
		case 'mssql':
			if (major >= 16) {
				return 'mssql16'; // version 2022 preview
			}
			if (major >= 13) {
				return 'mssql13'; // version 2016+
			}
			return 'fallback';
		default:
			// shouldnt get here but always use fallback just in case
			return 'fallback';
	}
}
