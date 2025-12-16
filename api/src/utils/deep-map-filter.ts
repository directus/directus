import type { CollectionOverview, FieldOverview, Filter, Relation, SchemaOverview } from '@directus/types';
import { getRelationInfo, type RelationInfo } from './get-relation-info.js';
import assert from 'node:assert';
import { isPlainObject } from 'lodash-es';
import { InvalidQueryError } from '@directus/errors';

export function deepMapFilter(
	filter: Filter,
	callback: (
		entry: [key: string | number, value: unknown],
		context: {
			collection: CollectionOverview;
			field: FieldOverview | null;
			relation: Relation | null;
			leaf: boolean;
			function: string | undefined;
			relationType: RelationInfo['relationType'] | null;
			object: Record<string, unknown>;
		},
	) => [key: string | number, value: unknown] | undefined,
	context: {
		schema: SchemaOverview;
		collection: string;
		relationInfo?: RelationInfo | undefined;
	},
): any {
	const collection = context.schema.collections[context.collection]!;

	assert(isObject(filter), `DeepMapResponse only works on objects, received ${JSON.stringify(filter)}`);

	const result = Object.fromEntries(
		Object.entries(filter)
			.map(([key, value]) => {
				if (key.startsWith('_')) {
					if (key === '_or' || key === '_and') {
						if (!Array.isArray(value)) {
							throw new InvalidQueryError({
								reason: `When selecting '${collection.collection}.${key}', the value has to be an array of filters`,
							});
						}

						value = (value as any[]).map((subFilter) =>
							deepMapFilter(subFilter, callback, {
								schema: context.schema,
								collection: context.collection,
								relationInfo: context.relationInfo,
							}),
						);
					} else {
						value = deepMapFilter(value as Filter, callback, {
							schema: context.schema,
							collection: context.collection,
							relationInfo: context.relationInfo,
						});
					}

					return callback([key, value], {
						collection,
						field: null,
						relation: null,
						function: undefined,
						leaf: true,
						relationType: null,
						object: filter,
					});
				}

				const [_key, relatedCollection] = key.split(':') as [string, string | undefined];
				key = _key;

				const functionMatch = /^([^$\s]*?)\((.*?)\)$/.exec(key);
				let functionName: string | undefined;

				if (functionMatch) {
					key = functionMatch[2]!;
					functionName = functionMatch[1]!;
				}

				const relationInfo = getRelationInfo(context.schema.relations, collection.collection, key);
				let leaf = true;

				const field = collection.fields[key];
				if (!relationInfo) return [key, value];

				if (relationInfo.relation && !isPrimitive(value)) {
					switch (relationInfo.relationType) {
						case 'm2o':
							value = deepMapFilter(value, callback, {
								schema: context.schema,
								collection: relationInfo.relation.related_collection!,
								relationInfo,
							});

							leaf = false;
							break;

						case 'o2m': {
							value = deepMapFilter(value, callback, {
								schema: context.schema,
								collection: relationInfo.relation.collection!,
								relationInfo,
							});

							leaf = false;
							break;
						}

						case 'o2a': {
							value = deepMapFilter(value, callback, {
								schema: context.schema,
								collection: relationInfo.relation.collection!,
								relationInfo,
							});

							leaf = false;
							break;
						}

						case 'a2o': {
							if (!relatedCollection || typeof relatedCollection !== 'string') {
								throw new InvalidQueryError({
									reason: `When selecting '${collection.collection}.${key}', the field '${collection.collection}.${
										relationInfo.relation.meta!.one_collection_field
									}' has to be selected when using versioning and m2a relations `,
								});
							}

							value = deepMapFilter(value, callback, {
								schema: context.schema,
								collection: relatedCollection,
								relationInfo,
							});

							leaf = false;
							break;
						}
					}
				}

				return callback([key, value], {
					collection,
					field: field ?? null,
					...relationInfo,
					function: functionName,
					leaf,
					object: filter,
				});
			})
			.filter((f) => f) as any[],
	);

	return result;
}

function isObject(value: unknown): value is Record<string, unknown> {
	return isPlainObject(value) && typeof value === 'object' && value !== null;
}

function isPrimitive(value: unknown) {
	return (typeof value !== 'object' && typeof value !== 'function') || value === null;
}
