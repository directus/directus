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
	const relations = schema.relations.reduce(
		(result, relation) => {
			if (relation.related_collection === collection && relation.meta?.one_field && relation.meta.one_field in item) {
				result[relation.meta.one_field] = relation.collection;
			}

			if (relation.collection === collection && relation.related_collection && relation.field in item) {
				result[relation.field] = relation.related_collection;
			}

			return result;
		},
		{} as Record<string, string>,
	);

	const result = { ...item };

	for (const versionRecord of versionData) {
		for (const key in item) {
			if (key in versionRecord === false) {
				continue;
			}

			const currentValue = item[key];
			const newValue = versionRecord[key];

			const { error } = alterationSchema.validate(newValue);

			if (error) {
				if (typeof newValue === 'object' && key in relations) {
					const newItem = !currentValue || typeof currentValue !== 'object' ? newValue : currentValue;
					result[key] = mergeVersionSaves(newItem, [newValue], relations[key]!, schema);
				} else {
					result[key] = newValue;
				}

				continue;
			}

			if (key in relations === false) {
				continue;
			}

			const alterations = newValue as Alterations;
			const related_collection = relations[key]!;

			const currentPrimaryKeyField = schema.collections[collection]!.primary;
			const relatedPrimaryKeyField = schema.collections[related_collection]!.primary;

			let mergedRelation: Item[] = [];

			if (Array.isArray(currentValue)) {
				mergedRelation = currentValue
					.filter((child: any) => {
						if (child?.[currentPrimaryKeyField]) return !alterations.delete.includes(child[currentPrimaryKeyField]);
						return !alterations.delete.includes(child);
					})
					.map((child: any) => {
						if (child?.[currentPrimaryKeyField]) {
							const updates = alterations.update.find(
								(updatedItem) => updatedItem[relatedPrimaryKeyField] === child[currentPrimaryKeyField],
							);

							if (updates) return { ...child, ...updates };
						}

						const updates = alterations.update.find((updatedItem) => updatedItem[relatedPrimaryKeyField] === child);

						if (updates) return updates;

						return child;
					});
			}

			if (alterations.create.length > 0) {
				for (const relatedItem of alterations.create) {
					mergedRelation.push(relatedItem);
				}
			}

			result[key] = mergedRelation;
		}
	}

	return result;
}
