import type { Collection } from '../types/index.js';
import type { Column } from '@directus/schema';
import type {
	Field,
	Relation,
	SnapshotCollection,
	SnapshotField,
	SnapshotRelation,
	SnapshotSystemField,
} from '@directus/types';
import { pick } from 'lodash-es';

/**
 * Pick certain database vendor specific collection properties that should be compared when performing diff
 *
 * @param collection collection to sanitize
 * @returns sanitized collection
 */

export function sanitizeCollection(collection: Collection) {
	return pick(collection, ['collection', 'fields', 'meta', 'schema.name']) as SnapshotCollection;
}

/**
 * Pick certain database vendor specific field properties that should be compared when performing diff
 *
 * @param field field to sanitize
 * @param sanitizeAllSchema Whether or not the whole field schema should be sanitized. Mainly used to prevent modifying autoincrement fields
 * @returns sanitized field
 */
export function sanitizeField(field: Field, sanitizeAllSchema = false) {
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
				'schema.is_indexed',
				'schema.is_primary_key',
				'schema.is_generated',
				'schema.generation_expression',
				'schema.has_auto_increment',
				'schema.foreign_key_table',
				'schema.foreign_key_column',
			];

	return pick(field, pickedPaths) as SnapshotField;
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
		'is_indexed',
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
export function sanitizeRelation(relation: Relation) {
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
	]) as SnapshotRelation;
}

/**
 * Pick certain specific system field properties that should be compared when performing diff
 *
 * @param field field to sanitize
 * @returns sanitized system field
 */
export function sanitizeSystemField(field: Field | SnapshotSystemField) {
	return pick(field, ['collection', 'field', 'schema.is_indexed']) as SnapshotSystemField;
}
