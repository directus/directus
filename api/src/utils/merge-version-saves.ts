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

		for (const [key, value] of Object.entries(item)) {
			if (!(key in versionRecord)) continue;

			const { error } = alterationSchema.validate(versionRecord[key]);

			if (error /*|| !Array.isArray(value)*/) {
				if (typeof versionRecord[key] === 'object' && key in relations) {
					// recurse into single relation

					result[key] = mergeVersionSaves(
						!value || typeof value !== 'object' ? versionRecord[key] : value,
						[versionRecord[key]],
						relations[key]!,
						schema,
					);
				} else {
					result[key] = versionRecord[key];
				}

				continue;
			}

			if (!(key in versionRecord) || !(key in relations)) {
				continue;
			}

			const alterations = versionRecord[key] as Alterations;
			const related_collection = relations[key]!;

			const currentPrimaryKeyField = schema.collections[collection]!.primary;
			const relatedPrimaryKeyField = schema.collections[related_collection]!.primary;

			result[key] = [
				...(Array.isArray(value) ? value : [])
					.filter((item: any) => {
						if (item?.[currentPrimaryKeyField]) return !alterations.delete?.includes(item[currentPrimaryKeyField]);
						return !alterations.delete?.includes(item);
					})
					.map((item: any) => {
						if (item?.[currentPrimaryKeyField]) {
							const updates = alterations.update?.find(
								(updatedItem) => updatedItem[relatedPrimaryKeyField] === item[currentPrimaryKeyField],
							);

							if (updates) return { ...item, ...updates };
						}

						const updates = alterations.update?.find((updatedItem) => updatedItem[relatedPrimaryKeyField] === item);

						if (updates) return updates;

						return item;
					}),
				...(alterations.create ?? []),
			];
		}
	}

	return result;
}
