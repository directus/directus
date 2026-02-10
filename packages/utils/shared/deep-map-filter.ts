import { InvalidQueryError } from '@directus/errors';
import type { CollectionOverview, FieldOverview, Filter, Relation, SchemaOverview } from '@directus/types';
import { isPlainObject } from 'lodash-es';
import { getRelationInfo, type RelationInfo } from './get-relation-info.js';

export type Quantity = 'some' | 'none' | null;

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
			quantity: Quantity;
			targetCollection?: string | undefined;
			object: Record<string, unknown>;
			path: string[];
		},
	) => [key: string | number, value: unknown] | undefined,
	context: {
		schema: SchemaOverview;
		collection: string;
		relationInfo?: RelationInfo | undefined;
		path?: string[];
	},
): any {
	const collection = context.schema.collections[context.collection]!;
	const path = context.path ?? [];

	if (!isObject(filter)) {
		throw new Error(`deepMapFilter only works on objects, received ${JSON.stringify(filter)}`);
	}

	const result = Object.fromEntries(
		Object.entries(filter)
			.map(([key, value]) => {
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
							path,
						}),
					);

					return callback([key, value], {
						collection,
						field: null,
						relation: null,
						function: undefined,
						leaf: false,
						relationType: null,
						quantity: null,
						object: filter,
						path,
					});
				}

				const [_key, targetCollection] = key.split(':') as [string, string | undefined];
				key = _key;

				const functionMatch = /^([^$\s]*?)\((.*?)\)$/.exec(key);
				let functionName: string | undefined;

				if (functionMatch) {
					key = functionMatch[2]!;
					functionName = functionMatch[1]!;
				}

				const relationInfo = getRelationInfo(context.schema.relations, collection.collection, key);
				let leaf = true;
				let quantity: Quantity = null;

				const field = collection.fields[key];
				if (!relationInfo) return [key, value];

				if (relationInfo.relation && !isPrimitive(value)) {
					switch (relationInfo.relationType) {
						case 'm2o':
							value = deepMapFilter(value, callback, {
								schema: context.schema,
								collection: relationInfo.relation.related_collection!,
								relationInfo,
								path: [...path, key],
							});

							leaf = false;
							break;

						case 'o2m': {
							const quantityInfo = extractQuantity(value as Record<string, any>);
							quantity = quantityInfo.quantity;
							value = quantityInfo.object;

							value = deepMapFilter(value, callback, {
								schema: context.schema,
								collection: relationInfo.relation.collection!,
								relationInfo,
								path: [...path, key],
							});

							leaf = false;
							break;
						}

						case 'o2a': {
							const quantityInfo = extractQuantity(value as Record<string, any>);
							quantity = quantityInfo.quantity;
							value = quantityInfo.object;

							value = deepMapFilter(value, callback, {
								schema: context.schema,
								collection: relationInfo.relation.collection!,
								relationInfo,
								path: [...path, key],
							});

							leaf = false;
							break;
						}

						case 'a2o': {
							if (!targetCollection || typeof targetCollection !== 'string') {
								throw new InvalidQueryError({
									reason: `When selecting '${collection.collection}.${key}', the field '${collection.collection}.${
										relationInfo.relation.meta!.one_collection_field
									}' has to be selected when using versioning and m2a relations `,
								});
							}

							value = deepMapFilter(value, callback, {
								schema: context.schema,
								collection: targetCollection,
								relationInfo,
								path: [...path, `${key}:${targetCollection}`],
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
					quantity,
					targetCollection,
					object: filter,
					path,
				});
			})
			.filter((f) => f) as any[],
	);

	return result;
}

function extractQuantity(object: Record<string, any>): {
	quantity: Quantity;
	object: Record<string, any>;
} {
	const key = Object.keys(object)[0]!;
	let quantity: Quantity = null;

	if (key === '_some') quantity = 'some';
	if (key === '_none') quantity = 'none';

	if (quantity) {
		return { quantity, object: object[key] };
	}

	return { quantity: null, object };
}

function isObject(value: unknown): value is Record<string, unknown> {
	return isPlainObject(value) && typeof value === 'object' && value !== null;
}

function isPrimitive(value: unknown) {
	return (typeof value !== 'object' && typeof value !== 'function') || value === null;
}
