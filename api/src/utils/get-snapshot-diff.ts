import { diff } from 'deep-diff';
import { omit, orderBy } from 'lodash';
import { Snapshot, SnapshotDiff } from '../types';
import { getVersionedHash } from './get-snapshot';
import { sanitizeCollection, sanitizeField, sanitizeRelation } from './sanitize-schema';

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
						hash: getVersionedHash(currentCollection),
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

					// Do not include default value in hash for autoincrement fields.
					// This is specifically for CockroachDB sequences that may be different between instances.
					const hash = isAutoIncrementPrimaryKey
						? getVersionedHash(omit(currentField, ['schema.default_value']))
						: getVersionedHash(currentField);

					return {
						collection: currentField.collection,
						field: currentField.field,
						hash,
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
						hash: getVersionedHash(currentRelation),
						diff: diff(sanitizeRelation(currentRelation), sanitizeRelation(afterRelation)),
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
						diff: diff(undefined, sanitizeRelation(afterRelation)),
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
