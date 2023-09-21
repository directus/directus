import { fieldTypeMap } from "./constants.js";
import type { DataModel, NameTransformer, RelationDefinition, SchemaDefinition } from "./types.js";

export interface Relation {
	collection: string;
	field: string;
	related_collection: string;
}

export function buildSchema(data: DataModel, nameFn: NameTransformer) {
	const result: SchemaDefinition = new Map();

	// setup the collections
	for (const collection of data.collections) {
		if (result.has(collection.collection)) {
			continue;
		}

		result.set(collection.collection, {
			name: nameFn(collection.collection),
			system: Boolean(collection.meta?.system),
			singleton: Boolean(collection.meta?.singleton),
			fields: [],
		});
	}

	// setup a relations lookup table
	const relationMap: Relation[] = []

	for (const relation of data.relations) {
		if (relation.meta?.system) {
			continue;
		}

		const { collection, field, related_collection } = relation;

		if (related_collection) {
			relationMap.push({ collection, field, related_collection });
		}
	}

	// fill in the fields
	for (const field of data.fields) {
		const collection = result.get(field.collection);

		if (collection === undefined || (collection.system && field.meta?.system)) {
			continue;
		}

		let mappedType = fieldTypeMap.get(field.type);
		let fieldRelation: RelationDefinition | null = null;

		// check many to any relations
		if (field.type === 'alias') {
			const relation = relationMap
				.find(({ related_collection }) => related_collection === field.collection);

			if (relation) {
				const relatedCollection = result.get(relation.related_collection);
				fieldRelation = { collection: relation.related_collection, mutliple: true };
				mappedType = relatedCollection!.fields.find((f) => f.primary_key)!.type;
			}
		}

		if (mappedType === undefined) {
			continue;
		}

		// check one to any relations
		if (fieldRelation == null) {
			const relation = relationMap
				.find((relation) => relation.collection === field.collection && relation.field === field.field);

			if (relation) {
				fieldRelation = { collection: relation.related_collection, mutliple: false };
			}
		}

		collection.fields.push({
			name: field.field,
			type: mappedType!,
			nullable: Boolean(field.schema?.is_nullable),
			primary_key: Boolean(field.schema?.is_primary_key),
			relation: fieldRelation
		});

		result.set(field.collection, collection);
	}

	// clean up untouched system collections or those without fields
	for (const [name, collection] of result) {
		if (collection.fields.length === 0) {
			result.delete(name);
		}
	}

	return result;
}
