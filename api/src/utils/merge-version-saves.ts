import type { Item, SchemaOverview } from '@directus/types';
import Joi from 'joi';
import { assign } from 'lodash-es';
import type { Alterations } from '../types/index.js';

const alterationSchema = Joi.object({
	create: Joi.array().items(Joi.object().unknown()),
	update: Joi.array().items(Joi.object().unknown()),
	delete: Joi.array().items(Joi.string(), Joi.number()),
});

export function mergeVersionSaves({
	payload,
	saves,
	collection,
	schema,
}: {
	payload: Record<any, any>;
	saves: Partial<Item>[];
	collection: string;
	schema: SchemaOverview;
}) {
	const relations = schema.relations.filter((relation) => {
		if (relation.related_collection !== collection) return false;
		if (!relation.meta?.one_field) return false;
		return relation.meta.one_field in payload;
	});

	for (const save of saves) {
		for (const [key, value] of Object.entries(payload)) {
			if (!(key in save)) continue;

			const { error } = alterationSchema.validate(save[key]);

			if (error || !Array.isArray(value)) {
				payload[key] = save[key];
				continue;
			}

			const alterations = save[key] as Alterations;

			for (const relation of relations) {
				const currentPrimaryKeyField = schema.collections[relation.related_collection!]!.primary;
				const relatedPrimaryKeyField = schema.collections[relation.collection]!.primary;

				payload[key] = [
					...value
						.filter((item) => {
							if (item?.[currentPrimaryKeyField]) return !alterations.delete.includes(item[currentPrimaryKeyField]);
							return !alterations.delete.includes(item);
						})
						.map((item) => {
							if (item?.[currentPrimaryKeyField]) {
								const updates = alterations.update.find(
									(updatedItem) => updatedItem[relatedPrimaryKeyField] === item[currentPrimaryKeyField],
								);

								if (updates) return assign({}, item, updates);
							}

							const updates = alterations.update.find((updatedItem) => updatedItem[relatedPrimaryKeyField] === item);

							if (updates) return updates;

							return item;
						}),
					...alterations.create,
				];
			}
		}
	}
}
