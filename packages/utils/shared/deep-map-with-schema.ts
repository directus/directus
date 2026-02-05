import assert from 'node:assert';
import { InvalidQueryError } from '@directus/errors';
import type { CollectionOverview, FieldOverview, Relation, SchemaOverview } from '@directus/types';
import { isPlainObject } from 'lodash-es';
import { getRelationInfo, type RelationInfo } from './get-relation-info.js';
import { isDetailedUpdateSyntax } from './is-detailed-update-syntax.js';

type DeepMapCallbackContext = {
	collection: CollectionOverview;
	field: FieldOverview;
	relation: Relation | null;
	leaf: boolean;
	relationType: RelationInfo['relationType'] | null;
	object: Record<string, unknown>;
	action?: 'create' | 'update' | 'delete' | undefined;
};

type DeepMapContext = {
	schema: SchemaOverview;
	collection: string;
	relationInfo?: RelationInfo & { action?: 'create' | 'update' | 'delete' | undefined };
};

type DeepMapOptions = {
	/** If set to true, fields that exist in the schema but not in the mapped data will be included and with a value of undefined */
	mapNonExistentFields?: boolean;
	/** If set to true, it will map primitive values to objects with primary key on o2m relations */
	mapPrimaryKeys?: boolean;
	/** If set to true, it will map the "create", "update" and "delete" syntax for o2m relations found in deltas */
	detailedUpdateSyntax?: boolean;
	/** If set to true, fields that are in the data but not in the schema will be removed */
	omitUnknownFields?: boolean;
	/** If set to true, a Promise will be returned instead of the value */
	processAsync?: boolean;
	/** If set to true, object reconstruction is skipped. Callback can return void. */
	iterateOnly?: boolean;
	/** Called when a field is not found in the schema. Return a new entry or undefined to omit. */
	onUnknownField?: (
		entry: DeepMapEntry,
		context: Pick<DeepMapCallbackContext, 'collection' | 'object' | 'action'>,
	) => DeepMapEntry | undefined | void | Promise<DeepMapEntry | undefined | void>;
};

type DeepMapEntry = [key: string | number, value: unknown];
type DeepMapCallback<T> = (entry: DeepMapEntry, context: DeepMapCallbackContext) => T;

/**
 * Allows to deep map the data like a response or delta changes with collection, field and relation context for each entry.
 * Reverse breadth first search. Order: [4, 5, 6, 2, 3, 1]
 *        [1]
 *       /   \
 *     [2]   [3]
 *    /   \    \
 *  [4]   [5]  [6]
 */
export function deepMapWithSchema(
	object: unknown,
	callback: DeepMapCallback<DeepMapEntry | undefined | void>,
	context: DeepMapContext,
	options?: DeepMapOptions & { processAsync?: false },
): any;

export function deepMapWithSchema(
	object: unknown,
	callback: DeepMapCallback<Promise<DeepMapEntry | undefined | void>>,
	context: DeepMapContext,
	options: DeepMapOptions & { processAsync: true },
): Promise<any>;

export function deepMapWithSchema(
	object: unknown,
	callback: DeepMapCallback<DeepMapEntry | undefined | void | Promise<DeepMapEntry | undefined | void>>,
	context: DeepMapContext,
	options?: DeepMapOptions,
): any | Promise<any> {
	const collection = context.schema.collections[context.collection]!;
	const action = context.relationInfo?.action;

	let primaryKeyMapped = false;

	if (options?.mapPrimaryKeys && !isObject(object)) {
		object = {
			[collection.primary]: object,
		};

		primaryKeyMapped = true;
	}

	assert(isObject(object), `DeepMapResponse only works on objects, received ${JSON.stringify(object)}`);

	let fields: [string, FieldOverview | undefined][];

	if (options?.mapNonExistentFields) {
		fields = Object.entries(collection.fields);
	} else {
		fields = Object.keys(object).map((key) => [key, collection.fields[key]]);
	}

	const processFields = (entries: [string, FieldOverview | undefined][]) => {
		const mapped = entries.map(([key, field]) => {
			const value = object[key];

			if (!field) {
				if (options?.onUnknownField) {
					return options.onUnknownField([key, value], {
						collection,
						object: object as Record<string, unknown>,
						action,
					});
				}

				return options?.omitUnknownFields ? undefined : [key, value];
			}

			const relationInfo = getRelationInfo(context.schema.relations, collection.collection, field.field);
			let leaf = true;

			let processedValue: any = value;

			if (relationInfo.relation && value !== null && (!isPrimitive(value) || options?.mapPrimaryKeys)) {
				switch (relationInfo.relationType) {
					case 'm2o': {
						// Ambiguous context (Link vs Update); reset action to prevent accidental "create"
						const subContext = {
							schema: context.schema,
							collection: relationInfo.relation.related_collection!,
							relationInfo: { ...relationInfo, action: undefined },
						};

						processedValue = deepMapWithSchema(processedValue, callback as any, subContext, options as any);
						leaf = false;
						break;
					}

					case 'o2m': {
						// Detailed syntax: explicit actions. Simple arrays: inherited ambiguous upsert behavior
						const map = (childValue: any, childAction?: 'create' | 'update' | 'delete') => {
							if (!isObject(childValue) && !options?.mapPrimaryKeys) return childValue;
							leaf = false;
							return deepMapWithSchema(
								childValue,
								callback as any,
								{
									schema: context.schema,
									collection: relationInfo!.relation!.collection,
									relationInfo: { ...relationInfo, action: childAction },
								},
								options as any,
							);
						};

						if (Array.isArray(processedValue)) {
							// Simple array results in ambiguous upsert behavior (action is undefined)
							processedValue = processArray(processedValue, (v) => map(v, undefined));
						} else if (options?.detailedUpdateSyntax && isDetailedUpdateSyntax(processedValue)) {
							const val = value as any;

							processedValue = {
								// Scoped action context per bucket
								create: processArray(val.create, (v) => map(v, 'create')),
								update: processArray(val.update, (v) => map(v, 'update')),
								delete: processArray(val.delete, (v) => map(v, 'delete')),
							};

							const extras: any[] = [];

							// Check for extra fields not allowed in detailed syntax
							if (options?.onUnknownField) {
								const relatedCollection = context.schema.collections[relationInfo!.relation!.collection];

								for (const key in val) {
									if (key !== 'create' && key !== 'update' && key !== 'delete') {
										const entry = options.onUnknownField([key, val[key]], {
											collection: relatedCollection!,
											object: val,
											action: undefined,
										});

										if (entry) extras.push(entry);
									}
								}
							}

							const mergeExtras = (dusValue: any, extras: any[]) => {
								for (const extra of extras) {
									if (extra) dusValue[extra[0]] = extra[1];
								}

								return dusValue;
							};

							const hasAsyncExtras = extras.some(isPromise);

							// Await all promises for async detailed syntax
							if (
								isPromise(processedValue.create) ||
								isPromise(processedValue.update) ||
								isPromise(processedValue.delete) ||
								hasAsyncExtras
							) {
								processedValue = Promise.all([
									processedValue.create,
									processedValue.update,
									processedValue.delete,
									hasAsyncExtras ? Promise.all(extras) : extras,
								]).then(([c, u, d, x]) => mergeExtras({ create: c, update: u, delete: d }, x));
							} else {
								processedValue = mergeExtras(processedValue, extras);
							}
						} else if (isObject(processedValue)) {
							// For non-standard objects, we still traverse it to ensure deep validation
							processedValue = map(processedValue, undefined);
						}

						break;
					}

					case 'a2o': {
						const related_collection = object[relationInfo.relation.meta!.one_collection_field!];

						if (!related_collection || typeof related_collection !== 'string') {
							throw new InvalidQueryError({
								reason: `When selecting '${collection.collection}.${field.field}', the field '${
									collection.collection
								}.${
									relationInfo.relation.meta!.one_collection_field
								}' has to be selected when using versioning and m2a relations `,
							});
						}

						// A2O is ambiguous; reset action to allow ID-based linking/creation via sub-context
						const subContext = {
							schema: context.schema,
							collection: related_collection,
							relationInfo: { ...relationInfo, action: undefined },
						};

						processedValue = deepMapWithSchema(processedValue, callback as any, subContext, options as any);

						leaf = false;
						break;
					}
				}
			}

			// After processing recursion, run callback
			return maybeAwait(processedValue, (finalValue) => {
				return callback([key, finalValue], { collection, field, ...relationInfo, leaf, object, action });
			});
		});

		if (options?.processAsync) return Promise.all(mapped);
		return mapped;
	};

	return maybeAwait(processFields(fields), (mappedFields: any[]) => {
		if (options?.iterateOnly) return undefined;
		const result = Object.fromEntries(mappedFields.filter((f) => f));
		if (primaryKeyMapped) return result[collection.primary];
		return result;
	});
}

function maybeAwait(value: any, fn: (val: any) => any) {
	if (isPromise(value)) return value.then(fn);
	return fn(value);
}

function processArray(arr: any[], fn: (item: any) => any) {
	if (!arr) return arr;
	const results = arr.map(fn);
	if (results.some(isPromise)) return Promise.all(results);
	return results;
}

function isPromise(value: any): value is Promise<any> {
	return !!value && typeof (value as any).then === 'function';
}

function isObject(value: unknown): value is Record<string, unknown> {
	return isPlainObject(value) && typeof value === 'object' && value !== null;
}

function isPrimitive(value: unknown) {
	return value == null || (typeof value !== 'object' && typeof value !== 'function');
}
