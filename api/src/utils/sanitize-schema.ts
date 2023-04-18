import type { Column } from '@directus/schema';
import type { Field, Relation } from '@directus/types';
import { pick } from 'lodash-es';
import type { Collection } from '../types/index.js';

/**
 * Pick certain database vendor specific collection properties that should be compared when performing diff
 *
 * @param collection collection to sanitize
 * @returns sanitized collection
 */

export function sanitizeCollection(collection: Collection | undefined) {
	if (!collection) return collection;

	return pick(collection, ['collection', 'fields', 'meta', 'schema.name']);
}

/**
 * Pick certain database vendor specific field properties that should be compared when performing diff
 *
 * @param field field to sanitize
 * @param sanitizeAllSchema Whether or not the whole field schema should be sanitized. Mainly used to prevent modifying autoincrement fields
 * @returns sanitized field
 */
export function sanitizeField(field: Field | undefined, sanitizeAllSchema = false) {
	if (!field) return field;

	const defaultPaths = ['collection', 'field', 'type', 'meta', 'name', 'children'];

	const pickedPaths = sanitizeAllSchema
		? defaultPaths
		: [
				...defaultPaths,
				'schema.name',
				'schema.table',
				'schema.data_type',
				'schema.default_value',
				'schema.max_length',
				'schema.numeric_precision',
				'schema.numeric_scale',
				'schema.is_nullable',
				'schema.is_unique',
				'schema.is_primary_key',
				'schema.is_generated',
				'schema.generation_expression',
				'schema.has_auto_increment',
				'schema.foreign_key_table',
				'schema.foreign_key_column',
		  ];

	return pick(field, pickedPaths);
}

export function sanitizeColumn(column: Column) {
	return pick(column, [
		'name',
		'table',
		'data_type',
		'default_value',
		'max_length',
		'numeric_precision',
		'numeric_scale',
		'is_nullable',
		'is_unique',
		'is_primary_key',
		'is_generated',
		'generation_expression',
		'has_auto_increment',
		'foreign_key_table',
		'foreign_key_column',
	]);
}

/**
 * Pick certain database vendor specific relation properties that should be compared when performing diff
 *
 * @param relation relation to sanitize
 * @returns sanitized relation
 */
export function sanitizeRelation(relation: Relation | undefined) {
	if (!relation) return relation;

	return pick(relation, [
		'collection',
		'field',
		'related_collection',
		'meta',
		'schema.table',
		'schema.column',
		'schema.foreign_key_table',
		'schema.foreign_key_column',
		'schema.constraint_name',
		'schema.on_update',
		'schema.on_delete',
	]);
}
