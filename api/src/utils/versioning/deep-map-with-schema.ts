import type { CollectionOverview, FieldOverview, Relation, SchemaOverview } from '@directus/types';
import { isPlainObject } from 'lodash-es';
import assert from 'node:assert';
import { getRelationInfo, type RelationInfo } from '../get-relation-info.js';
import { InvalidQueryError } from '@directus/errors';

/**
 * Allows to deep map the data like a response or delta changes with collection, field and relation context for each entry.
 * Bottom to Top depth first mapping of values.
 */
export function deepMapWithSchema(
	object: Record<string, any>,
	callback: (
		entry: [key: string | number, value: unknown],
		context: {
			collection: CollectionOverview;
			field: FieldOverview;
			relation: Relation | null;
			leaf: boolean;
			relationType: RelationInfo['relationType'] | null;
			object: Record<string, any>;
		},
	) => [key: string | number, value: unknown] | undefined,
	context: {
		schema: SchemaOverview;
		collection: string;
		relationInfo?: RelationInfo;
	},
	options?: {
		/** If set to true, non-existent fields will be included in the mapping and will have a value of undefined */
		mapNonExistentFields?: boolean;
		/** If set to true, it will map primitive values to objects with primary key on o2m relations */
		mapPrimaryKeys?: boolean;
		/** If set to true, it will map the "create", "update" and "delete" syntax for o2m relations found in deltas */
		detailedUpdateSyntax?: boolean;
		/** If set to true, will throw away fields that are not in the schema */
		omitUnknownFields?: boolean;
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
		fields
			.map(([key, field]) => {
				let value = object[key];

				if (!field) return options?.omitUnknownFields ? undefined : [key, value];

				const relationInfo = getRelationInfo(context.schema.relations, collection.collection, field.field);
				let leaf = true;

				if (relationInfo.relation && typeof value === 'object' && value !== null && isPlainObject(object)) {
					switch (relationInfo.relationType) {
						case 'm2o':
							value = deepMapWithSchema(
								value,
								callback,
								{
									schema: context.schema,
									collection: relationInfo.relation.related_collection!,
									relationInfo,
								},
								options,
							);

							leaf = false;
							break;

						case 'o2m': {
							const primaryKeyField = context.schema.collections[relationInfo!.relation!.collection]!.primary;

							function map(childValue: any) {
								if (!isPlainObject(childValue) || typeof childValue !== 'object' || childValue === null) {
									if (!options?.mapPrimaryKeys) return childValue;

									childValue = {
										[primaryKeyField]: childValue,
									};
								}

								leaf = false;
								return deepMapWithSchema(
									childValue,
									callback,
									{
										schema: context.schema,
										collection: relationInfo!.relation!.collection,
										relationInfo,
									},
									options,
								);
							}

							if (Array.isArray(value)) {
								value = (value as any[]).map(map);
							} else if (options?.detailedUpdateSyntax && isPlainObject(value)) {
								value = {
									create: value['create']?.map(map),
									update: value['update']?.map(map),
									delete: value['delete']?.map(map),
								};
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

							value = deepMapWithSchema(
								value,
								callback,
								{
									schema: context.schema,
									collection: related_collection,
									relationInfo,
								},
								options,
							);

							leaf = false;
							break;
						}
					}
				}

				return callback([key, value], { collection, field, ...relationInfo, leaf, object });
			})
			.filter((f) => f) as any[],
	);
}

// TODO: Figure out a way to reduce code duplication with deepMapWithSchema
export async function asyncDeepMapWithSchema(
	object: Record<string, any>,
	callback: (
		entry: [key: string | number, value: unknown],
		context: {
			collection: CollectionOverview;
			field: FieldOverview;
			relation: Relation | null;
			leaf: boolean;
			relationType: RelationInfo['relationType'] | null;
			object: Record<string, any>;
		},
	) => Promise<[key: string | number, value: unknown] | undefined>,
	context: {
		schema: SchemaOverview;
		collection: string;
		relationInfo?: RelationInfo;
	},
	options?: {
		/** If set to true, non-existent fields will be included in the mapping and will have a value of undefined */
		mapNonExistentFields?: boolean;
		/** If set to true, it will map primitive values to objects with primary key on o2m relations */
		mapPrimaryKeys?: boolean;
		/** If set to true, it will map the "create", "update" and "delete" syntax for o2m relations found in deltas */
		detailedUpdateSyntax?: boolean;
		/** If set to true, will throw away fields that are not in the schema */
		omitUnknownFields?: boolean;
	},
): Promise<any> {
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
		(
			await Promise.all(
				fields.map(async ([key, field]) => {
					let value = object[key];

					if (!field) return options?.omitUnknownFields ? undefined : [key, value];

					const relationInfo = getRelationInfo(context.schema.relations, collection.collection, field.field);
					let leaf = true;

					if (relationInfo.relation && typeof value === 'object' && value !== null && isPlainObject(object)) {
						switch (relationInfo.relationType) {
							case 'm2o':
								value = await asyncDeepMapWithSchema(
									value,
									callback,
									{
										schema: context.schema,
										collection: relationInfo.relation.related_collection!,
										relationInfo,
									},
									options,
								);

								leaf = false;
								break;

							case 'o2m': {
								const primaryKeyField = context.schema.collections[relationInfo!.relation!.collection]!.primary;

								async function map(childValue: any) {
									if (!isPlainObject(childValue) || typeof childValue !== 'object' || childValue === null) {
										if (!options?.mapPrimaryKeys) return childValue;

										childValue = {
											[primaryKeyField]: childValue,
										};
									}

									leaf = false;
									return await asyncDeepMapWithSchema(
										childValue,
										callback,
										{
											schema: context.schema,
											collection: relationInfo!.relation!.collection,
											relationInfo,
										},
										options,
									);
								}

								if (Array.isArray(value)) {
									value = await Promise.all((value as any[]).map(map));
								} else if (options?.detailedUpdateSyntax && isPlainObject(value)) {
									value = {
										create: await Promise.all(value['create']?.map(map)),
										update: await Promise.all(value['update']?.map(map)),
										delete: await Promise.all(value['delete']?.map(map)),
									};
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

								value = await asyncDeepMapWithSchema(
									value,
									callback,
									{
										schema: context.schema,
										collection: related_collection,
										relationInfo,
									},
									options,
								);

								leaf = false;
								break;
							}
						}
					}

					return await callback([key, value], { collection, field, ...relationInfo, leaf, object });
				}),
			)
		).filter((f) => f) as any[],
	);
}
