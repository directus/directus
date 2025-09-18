import deepDiff from 'deep-diff';
import type { Snapshot, SnapshotDiff, SnapshotSystemField } from '@directus/types';
import { DiffKind } from '@directus/types';
import { sanitizeCollection, sanitizeField, sanitizeRelation, sanitizeSystemField } from './sanitize-schema.js';

export function getSnapshotDiff(current: Snapshot, after: Snapshot): SnapshotDiff {
	const diffedSnapshot: SnapshotDiff = {
		collections: [
			...current.collections.map((currentCollection) => {
				const afterCollection = after.collections.find(
					(afterCollection) => afterCollection.collection === currentCollection.collection,
				);

				const afterCollectionSanitized = afterCollection ? sanitizeCollection(afterCollection) : undefined;

				return {
					collection: currentCollection.collection,
					diff: deepDiff.diff(sanitizeCollection(currentCollection), afterCollectionSanitized),
				};
			}),
			...after.collections
				.filter((afterCollection) => {
					const currentCollection = current.collections.find(
						(currentCollection) => currentCollection.collection === afterCollection.collection,
					);

					return !!currentCollection === false;
				})
				.map((afterCollection) => ({
					collection: afterCollection.collection,
					diff: deepDiff.diff(undefined, sanitizeCollection(afterCollection)),
				})),
		].filter((obj) => Array.isArray(obj.diff)) as SnapshotDiff['collections'],
		fields: [
			...current.fields.map((currentField) => {
				const afterField = after.fields.find(
					(afterField) => afterField.collection === currentField.collection && afterField.field === currentField.field,
				);

				const isAutoIncrementPrimaryKey =
					!!currentField.schema?.is_primary_key && !!currentField.schema?.has_auto_increment;

				// Changing to/from alias fields should delete the current field
				if (
					afterField &&
					currentField.type !== afterField.type &&
					(currentField.type === 'alias' || afterField.type === 'alias')
				) {
					return {
						collection: currentField.collection,
						field: currentField.field,
						diff: deepDiff.diff(sanitizeField(currentField, isAutoIncrementPrimaryKey), undefined),
					};
				}

				const afterFieldSanitized = afterField ? sanitizeField(afterField, isAutoIncrementPrimaryKey) : undefined;

				return {
					collection: currentField.collection,
					field: currentField.field,
					diff: deepDiff.diff(sanitizeField(currentField, isAutoIncrementPrimaryKey), afterFieldSanitized),
				};
			}),
			...after.fields
				.filter((afterField) => {
					let currentField = current.fields.find(
						(currentField) =>
							currentField.collection === afterField.collection && afterField.field === currentField.field,
					);

					// Changing to/from alias fields should create the new field
					if (
						currentField &&
						currentField.type !== afterField.type &&
						(currentField.type === 'alias' || afterField.type === 'alias')
					) {
						currentField = undefined;
					}

					return !!currentField === false;
				})
				.map((afterField) => ({
					collection: afterField.collection,
					field: afterField.field,
					diff: deepDiff.diff(undefined, sanitizeField(afterField)),
				})),
		].filter((obj) => Array.isArray(obj.diff)) as SnapshotDiff['fields'],
		systemFields: [
			...(current.systemFields ?? []).map((currentSystemField) => {
				const afterSystemField = (after.systemFields ?? []).find(
					(afterSystemField) =>
						afterSystemField.collection === currentSystemField.collection &&
						afterSystemField.field === currentSystemField.field,
				);

				const afterSystemFieldSanitized = afterSystemField
					? sanitizeSystemField(afterSystemField)
					: invertIndexed(currentSystemField);

				return {
					collection: currentSystemField.collection,
					field: currentSystemField.field,
					diff: deepDiff.diff(sanitizeSystemField(currentSystemField), afterSystemFieldSanitized),
				};
			}),
			...(after.systemFields ?? [])
				.filter((afterSystemField) => {
					if (!afterSystemField.schema.is_indexed) return false;

					const currentSystemField = (current.systemFields ?? []).find(
						(currentSystemField) =>
							currentSystemField.collection === afterSystemField.collection &&
							afterSystemField.field === currentSystemField.field,
					);

					return Boolean(currentSystemField) === false;
				})
				.map((afterSystemField) => {
					const currentSystemField = (current.systemFields ?? []).find(
						(currentSystemField) =>
							currentSystemField.collection === afterSystemField.collection &&
							currentSystemField.field === afterSystemField.field,
					);

					const currentSystemFieldSanitized = currentSystemField
						? sanitizeSystemField(currentSystemField)
						: invertIndexed(afterSystemField);

					return {
						collection: afterSystemField.collection,
						field: afterSystemField.field,
						diff: deepDiff.diff(currentSystemFieldSanitized, sanitizeSystemField(afterSystemField)),
					};
				}),
		].filter((obj) => Array.isArray(obj.diff)) as SnapshotDiff['systemFields'],
		relations: [
			...current.relations.map((currentRelation) => {
				const afterRelation = after.relations.find(
					(afterRelation) =>
						afterRelation.collection === currentRelation.collection && afterRelation.field === currentRelation.field,
				);

				const afterRelationSanitized = afterRelation ? sanitizeRelation(afterRelation) : undefined;

				return {
					collection: currentRelation.collection,
					field: currentRelation.field,
					related_collection: currentRelation.related_collection,
					diff: deepDiff.diff(sanitizeRelation(currentRelation), afterRelationSanitized),
				};
			}),
			...after.relations
				.filter((afterRelation) => {
					const currentRelation = current.relations.find(
						(currentRelation) =>
							currentRelation.collection === afterRelation.collection && afterRelation.field === currentRelation.field,
					);

					return !!currentRelation === false;
				})
				.map((afterRelation) => ({
					collection: afterRelation.collection,
					field: afterRelation.field,
					related_collection: afterRelation.related_collection,
					diff: deepDiff.diff(undefined, sanitizeRelation(afterRelation)),
				})),
		].filter((obj) => Array.isArray(obj.diff)) as SnapshotDiff['relations'],
	};

	/**
	 * When you delete a collection, we don't have to individually drop all the fields/relations as well
	 */

	const deletedCollections = diffedSnapshot.collections
		.filter((collection) => collection.diff?.[0]?.kind === DiffKind.DELETE)
		.map(({ collection }) => collection);

	diffedSnapshot.fields = diffedSnapshot.fields.filter(
		(field) => deletedCollections.includes(field.collection) === false,
	);

	diffedSnapshot.relations = diffedSnapshot.relations.filter(
		(relation) => deletedCollections.includes(relation.collection) === false,
	);

	return diffedSnapshot;
}

function invertIndexed(field: SnapshotSystemField): SnapshotSystemField {
	const newSchema: SnapshotSystemField['schema'] = { ...field.schema };

	if ('is_indexed' in field.schema) {
		newSchema.is_indexed = !field.schema.is_indexed;
	}

	return { ...field, schema: newSchema };
}
