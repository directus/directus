import type { Item, SchemaOverview } from '@directus/types';
import Joi from 'joi';
import type { Alterations } from '../types/index.js';

const alterationSchema = Joi.object({
	create: Joi.array().items(Joi.object().unknown()),
	update: Joi.array().items(Joi.object().unknown()),
	delete: Joi.array().items(Joi.string(), Joi.number()),
});

export function mergeVersionsRaw(item: Item, versionData: Partial<Item>[]) {
	const result = { ...item };

	for (const versionRecord of versionData) {
		for (const key in versionRecord) {
			result[key] = versionRecord[key];
		}
	}

	return result;
}

export function mergeVersionSaves(
	item: Item,
	versionData: Partial<Item>[],
	collection: string,
	schema: SchemaOverview,
): Item {
	if (versionData.length === 0) return item;

	return recursiveMerging(item, versionData, collection, schema) as Item;
}

function recursiveMerging(
	data: Item,
	versionData: Partial<Item>[],
	collection: string,
	schema: SchemaOverview,
): unknown {
	const result = { ...data };
	const relations = getRelations(collection, schema);

	for (const versionRecord of versionData) {
		for (const key in data) {
			if (!versionRecord || key in versionRecord === false) {
				continue;
			}

			const currentValue = data[key];
			const newValue = versionRecord[key];

			if (typeof newValue !== 'object' || newValue === null) {
				// primitive type substitution
				result[key] = newValue;
				continue;
			}

			if (key in relations === false) {
				// item is not a relation
				continue;
			}

			// console.log('a', {key, currentValue, newValue});

			const { error } = alterationSchema.validate(newValue);

			if (error) {
				if (typeof newValue === 'object' && key in relations) {
					const newItem = !currentValue || typeof currentValue !== 'object' ? newValue : currentValue;
					// console.log('recur', {newItem, newValue, rel:relations[key]});
					result[key] = mergeVersionSaves(newItem, [newValue], relations[key]!, schema);
				}

				continue;
			}

			const alterations = newValue as Alterations;
			const related_collection = relations[key]!;

			const currentPrimaryKeyField = schema.collections[collection]!.primary;
			const relatedPrimaryKeyField = schema.collections[related_collection]!.primary;

			let mergedRelation: Item[] = [];
			// console.log(currentValue, alterations)

			if (Array.isArray(currentValue)) {
				if (alterations.delete.length > 0) {
					for (const currentItem of currentValue) {
						const currentId = typeof currentItem === 'object'
							? currentItem[currentPrimaryKeyField]
							: currentItem;
						if (alterations.delete.includes(currentId) === false) {
							mergedRelation.push(currentItem);
						}
					}
				}

				if (alterations.update.length > 0) {
					for (const updatedItem of alterations.update) {
						// find existing item to update
						const item = mergedRelation.find((currentItem) => currentItem[relatedPrimaryKeyField] === updatedItem[currentPrimaryKeyField]);

						// console.log('debug', item, updatedItem);

						if (!item) {
							// nothing to update so add the item as is
							mergedRelation.push(updatedItem);
							continue;
						}

						mergedRelation.push({ ...item, ...updatedItem });
					}
				}
			}

			if (alterations.create.length > 0) {
				for (const createdItem of alterations.create) {
					mergedRelation.push(createdItem);
				}
			}

			result[key] = mergedRelation;
		}
	}

	return result;
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
