import { Field, Relation } from '@directus/shared/types';
import { omit } from 'lodash';
import { Collection } from '../types';

/**
 * Omit certain database vendor specific collection properties that should not be compared when performing diff
 *
 * @param collection collection to sanitize
 * @returns sanitized collection
 *
 * @see {@link https://github.com/knex/knex-schema-inspector/blob/master/lib/types/table.ts}
 */

export function sanitizeCollection(collection: Collection | undefined) {
	const omittedPaths = [
		// Not supported in SQLite + comment in MSSQL
		'schema.comment',
		'schema.schema',

		// MySQL Only
		'schema.collation',
		'schema.engine',

		// Postgres Only
		'schema.owner',

		// SQLite Only
		'schema.sql',

		//MSSQL only
		'schema.catalog',
	];

	return collection ? omit(collection, omittedPaths) : collection;
}

/**
 * Omit certain database vendor specific field properties that should not be compared when performing diff
 *
 * @param field field to sanitize
 * @param sanitizeAllSchema Whether or not the whole field schema should be sanitized. Mainly used to prevent modifying autoincrement fields
 * @returns sanitized field
 *
 * @see {@link https://github.com/knex/knex-schema-inspector/blob/master/lib/types/column.ts}
 */
export function sanitizeField(field: Field | undefined, sanitizeAllSchema = false) {
	const omittedPaths = sanitizeAllSchema
		? ['schema']
		: [
				// Not supported in SQLite or MSSQL
				'schema.comment',

				// Postgres Only
				'schema.schema',
				'schema.foreign_key_schema',
		  ];

	return field ? omit(field, omittedPaths) : field;
}

/**
 * Omit certain database vendor specific relation properties that should not be compared when performing diff
 *
 * @param relation relation to sanitize
 * @returns sanitized relation
 *
 * @see {@link https://github.com/knex/knex-schema-inspector/blob/master/lib/types/foreign-key.ts}
 */
export function sanitizeRelation(relation: Relation | undefined) {
	const omittedPaths = [
		// Postgres + MSSSQL
		'schema.foreign_key_schema',
	];

	return relation ? omit(relation, omittedPaths) : relation;
}
