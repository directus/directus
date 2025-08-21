import type { CollectionOverview, FieldOverview, Relation, SchemaOverview } from '@directus/types';
import { isPlainObject } from 'lodash-es';
import assert from 'node:assert';
import { getRelationInfo, type RelationInfo } from '../get-relation-info.js';
import { InvalidQueryError } from '@directus/errors';

/**
 * Allows to deep map the response from the ItemsService with collection, field and relation context for each entry.
 * Bottom to Top depth first mapping of values.
 */
export function deepMapDelta(
	object: Record<string, any>,
	callback: (
		entry: [key: string | number, value: unknown],
		context: {
			collection: CollectionOverview;
			field: FieldOverview;
			relation: Relation | null;
			leaf: boolean;
			relationType: RelationInfo['relationType'] | null;
		},
	) => [key: string | number, value: unknown],
	context: {
		schema: SchemaOverview;
		collection: string;
		relationInfo?: RelationInfo;
	},
	options?: {
		mapNonExistentFields?: boolean;
	},
): any {
	const collection = context.schema.collections[context.collection]!;

	assert(
		isPlainObject(object) && typeof object === 'object' && object !== null,
		`DeepMapResponse only works on objects, received ${JSON.stringify(object)}`,
	);

	let fields: [string, FieldOverview][];

	if (options?.mapNonExistentFields) {
		fields = Object.entries(collection.fields);
	} else {
		fields = Object.keys(object).map((key) => [key, collection.fields[key]!]);
	}

	return Object.fromEntries(
		fields.map(([key, field]) => {
			let value = object[key];

			if (!field) return [key, value];

			const relationInfo = getRelationInfo(context.schema.relations, collection.collection, field.field);
			let leaf = true;

			if (relationInfo.relation && typeof value === 'object' && value !== null && isPlainObject(object)) {
				switch (relationInfo.relationType) {
					case 'm2o':
						value = deepMapDelta(value, callback, {
							schema: context.schema,
							collection: relationInfo.relation.related_collection!,
							relationInfo,
						});

						leaf = false;
						break;

					case 'o2m': {
						function map(childValue: any) {
							if (isPlainObject(childValue) && typeof childValue === 'object' && childValue !== null) {
								leaf = false;
								return deepMapDelta(childValue, callback, {
									schema: context.schema,
									collection: relationInfo!.relation!.collection,
									relationInfo,
								});
							} else return childValue;
						}

						if (Array.isArray(value)) {
							value = (value as any[]).map(map);
						} else {
							if (Array.isArray(value['create'])) value['create'] = value['create'].map(map);
							if (Array.isArray(value['update'])) value['update'] = value['update'].map(map);
							if (Array.isArray(value['delete'])) value['delete'] = value['delete'].map(map);
						}

						break;
					}

					case 'a2o': {
						const related_collection = object[relationInfo.relation.meta!.one_collection_field!];

						if (!related_collection) {
							throw new InvalidQueryError({
								reason: `When selecting '${collection.collection}.${field.field}', the field '${
									collection.collection
								}.${
									relationInfo.relation.meta!.one_collection_field
								}' has to be selected when using versioning and m2a relations `,
							});
						}

						value = deepMapDelta(value, callback, {
							schema: context.schema,
							collection: related_collection,
							relationInfo,
						});

						leaf = false;
						break;
					}
				}
			}

			return callback([key, value], { collection, field, ...relationInfo, leaf });
		}),
	);
}
