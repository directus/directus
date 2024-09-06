import type { Alterations, Item, SchemaOverview } from '@directus/types';
import { isObject } from '@directus/utils';
import Joi from 'joi';
import { cloneDeep } from 'lodash-es';

const alterationSchema = Joi.object({
	create: Joi.array().items(Joi.object().unknown()),
	update: Joi.array().items(Joi.object().unknown()),
	delete: Joi.array().items(Joi.string(), Joi.number()),
});

export function mergeVersionsRaw(item: Item, versionData: Partial<Item>[]) {
	const result = cloneDeep(item);

	for (const versionRecord of versionData) {
		for (const key of Object.keys(versionRecord)) {
			result[key] = versionRecord[key];
		}
	}

	return result;
}

export function mergeVersionsRecursive(
	item: Item,
	versionData: Item[],
	collection: string,
	schema: SchemaOverview,
): Item {
	if (versionData.length === 0) return item;

	return recursiveMerging(item, versionData, collection, schema) as Item;
}

function recursiveMerging(data: Item, versionData: unknown[], collection: string, schema: SchemaOverview): unknown {
	const result = cloneDeep(data);
	const relations = getRelations(collection, schema);

	for (const versionRecord of versionData) {
		if (!isObject(versionRecord)) {
			continue;
		}

		for (const key of Object.keys(data)) {
			if (key in versionRecord === false) {
				continue;
			}

			const currentValue: unknown = data[key];
			const newValue: unknown = versionRecord[key];

			if (typeof newValue !== 'object' || newValue === null) {
				// primitive type substitution, json and non relational array values are handled in the next check
				result[key] = newValue;
				continue;
			}

			if (key in relations === false) {
				// check for m2a exception
				if (isManyToAnyCollection(collection, schema) && key === 'item') {
					const item = addMissingKeys(isObject(currentValue) ? currentValue : {}, newValue);
					result[key] = recursiveMerging(item, [newValue], data['collection'], schema);
				} else {
					// item is not a relation
					result[key] = newValue;
				}

				continue;
			}

			const { error } = alterationSchema.validate(newValue);

			if (error) {
				if (typeof newValue === 'object' && key in relations) {
					const newItem = !currentValue || typeof currentValue !== 'object' ? newValue : currentValue;
					result[key] = recursiveMerging(newItem, [newValue], relations[key]!, schema);
				}

				continue;
			}

			const alterations = newValue as Alterations;
			const currentPrimaryKeyField = schema.collections[collection]!.primary;
			const relatedPrimaryKeyField = schema.collections[relations[key]!]!.primary;

			const mergedRelation: Item[] = [];

			if (Array.isArray(currentValue)) {
				if (alterations.delete.length > 0) {
					for (const currentItem of currentValue) {
						const currentId = typeof currentItem === 'object' ? currentItem[currentPrimaryKeyField] : currentItem;

						if (alterations.delete.includes(currentId) === false) {
							mergedRelation.push(currentItem);
						}
					}
				} else {
					mergedRelation.push(...currentValue);
				}

				if (alterations.update.length > 0) {
					for (const updatedItem of alterations.update) {
						// find existing item to update
						const itemIndex = mergedRelation.findIndex(
							(currentItem) => currentItem[relatedPrimaryKeyField] === updatedItem[currentPrimaryKeyField],
						);

						if (itemIndex === -1) {
							// check for raw primary keys
							const pkIndex = mergedRelation.findIndex(
								(currentItem) => currentItem === updatedItem[currentPrimaryKeyField],
							);

							if (pkIndex === -1) {
								// nothing to update so add the item as is
								mergedRelation.push(updatedItem);
							} else {
								mergedRelation[pkIndex] = updatedItem;
							}

							continue;
						}

						const item = addMissingKeys(mergedRelation[itemIndex]!, updatedItem);

						mergedRelation[itemIndex] = recursiveMerging(item, [updatedItem], relations[key]!, schema) as Item;
					}
				}
			}

			if (alterations.create.length > 0) {
				for (const createdItem of alterations.create) {
					const item = addMissingKeys({}, createdItem);
					mergedRelation.push(recursiveMerging(item, [createdItem], relations[key]!, schema) as Item);
				}
			}

			result[key] = mergedRelation;
		}
	}

	return result;
}

function addMissingKeys(item: Item, edits: Item) {
	const result: Item = { ...item };

	for (const key of Object.keys(edits)) {
		if (key in item === false) {
			result[key] = null;
		}
	}

	return result;
}

function isManyToAnyCollection(collection: string, schema: SchemaOverview) {
	const relation = schema.relations.find(
		(relation) => relation.collection === collection && relation.meta?.many_collection === collection,
	);

	if (!relation || !relation.meta?.one_field || !relation.related_collection) return false;

	return Boolean(
		schema.collections[relation.related_collection]?.fields[relation.meta.one_field]?.special.includes('m2a'),
	);
}

function getRelations(collection: string, schema: SchemaOverview) {
	return schema.relations.reduce(
		(result, relation) => {
			if (relation.related_collection === collection && relation.meta?.one_field) {
				result[relation.meta.one_field] = relation.collection;
			}

			if (relation.collection === collection && relation.related_collection) {
				result[relation.field] = relation.related_collection;
			}

			return result;
		},
		{} as Record<string, string>,
	);
}
