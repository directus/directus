import type { SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { VERSION_SYSTEM_FIELDS } from '../../../../services/versions/version-system-fields.js';
import { getColumn } from '../../utils/get-column.js';

export function applyVersion(
	knex: Knex,
	schema: SchemaOverview,
	rootQuery: Knex.QueryBuilder,
	version: string,
	collection: string,
) {
	rootQuery.where(getColumn(knex, collection, VERSION_SYSTEM_FIELDS.version.field, false, schema) as any, version);
}
