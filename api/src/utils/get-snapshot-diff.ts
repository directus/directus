import { Field } from '@directus/shared/types';
import { diff } from 'deep-diff';
import { omit, orderBy } from 'lodash';
import { Collection, Snapshot, SnapshotDiff } from '../types';

export function getSnapshotDiff(current: Snapshot, after: Snapshot): SnapshotDiff {
	const diffedSnapshot: SnapshotDiff = {
		collections: orderBy(
			[
				...current.collections.map((currentCollection) => {
					const afterCollection = after.collections.find(
						(afterCollection) => afterCollection.collection === currentCollection.collection
					);

					return {
						collection: currentCollection.collection,
						diff: diff(sanitizeCollection(currentCollection), sanitizeCollection(afterCollection)),
					};
				}),
				...after.collections
					.filter((afterCollection) => {
						const currentCollection = current.collections.find(
							(currentCollection) => currentCollection.collection === afterCollection.collection
						);

						return !!currentCollection === false;
					})
					.map((afterCollection) => ({
						collection: afterCollection.collection,
						diff: diff(undefined, sanitizeCollection(afterCollection)),
					})),
			].filter((obj) => Array.isArray(obj.diff)) as SnapshotDiff['collections'],
			'collection'
		),
		fields: orderBy(
			[
				...current.fields.map((currentField) => {
					const afterField = after.fields.find(
						(afterField) => afterField.collection === currentField.collection && afterField.field === currentField.field
					);

					const isAutoIncrementPrimaryKey =
						!!currentField.schema?.is_primary_key && !!currentField.schema?.has_auto_increment;

					return {
						collection: currentField.collection,
						field: currentField.field,
						diff: diff(
							sanitizeField(currentField, isAutoIncrementPrimaryKey),
							sanitizeField(afterField, isAutoIncrementPrimaryKey)
						),
					};
				}),
				...after.fields
					.filter((afterField) => {
						const currentField = current.fields.find(
							(currentField) =>
								currentField.collection === afterField.collection && afterField.field === currentField.field
						);

						return !!currentField === false;
					})
					.map((afterField) => ({
						collection: afterField.collection,
						field: afterField.field,
						diff: diff(undefined, sanitizeField(afterField)),
					})),
			].filter((obj) => Array.isArray(obj.diff)) as SnapshotDiff['fields'],
			['collection']
		),
		relations: orderBy(
			[
				...current.relations.map((currentRelation) => {
					const afterRelation = after.relations.find(
						(afterRelation) =>
							afterRelation.collection === currentRelation.collection && afterRelation.field === currentRelation.field
					);

					return {
						collection: currentRelation.collection,
						field: currentRelation.field,
						related_collection: currentRelation.related_collection,
						diff: diff(currentRelation, afterRelation),
					};
				}),
				...after.relations
					.filter((afterRelation) => {
						const currentRelation = current.relations.find(
							(currentRelation) =>
								currentRelation.collection === afterRelation.collection && afterRelation.field === currentRelation.field
						);

						return !!currentRelation === false;
					})
					.map((afterRelation) => ({
						collection: afterRelation.collection,
						field: afterRelation.field,
						related_collection: afterRelation.related_collection,
						diff: diff(undefined, afterRelation),
					})),
			].filter((obj) => Array.isArray(obj.diff)) as SnapshotDiff['relations'],
			['collection']
		),
	};

	/**
	 * When you delete a collection, we don't have to individually drop all the fields/relations as well
	 */

	const deletedCollections = diffedSnapshot.collections
		.filter((collection) => collection.diff?.[0].kind === 'D')
		.map(({ collection }) => collection);

	diffedSnapshot.fields = diffedSnapshot.fields.filter(
		(field) => deletedCollections.includes(field.collection) === false
	);

	diffedSnapshot.relations = diffedSnapshot.relations.filter(
		(relation) => deletedCollections.includes(relation.collection) === false
	);

	return diffedSnapshot;
}

/**
 * Omit certain database vendor specific collection properties that should not be compared when performing diff
 *
 * @param collection collection to sanitize
 * @returns sanitized collection
 *
 * @see {@link https://github.com/knex/knex-schema-inspector/blob/master/lib/types/table.ts}
 */

function sanitizeCollection(collection: Collection | undefined) {
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
function sanitizeField(field: Field | undefined, sanitizeAllSchema = false) {
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
