import { fieldTypeMap } from "./constants.js";
import type { DataModel, FieldDefinition, NameTransformer, SchemaDefinition } from "./types.js";


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

	// fill in the fields
	for (const field of data.fields) {
		const collection = result.get(field.collection);

		if (collection === undefined || (collection.system && field.meta?.system)) {
			continue;
		}

		let mappedType: string[] | string | undefined = fieldTypeMap.get(field.type);
		let fieldRelation: FieldDefinition['relation'] = null;

		// check many to any relations
		if (field.type === 'alias') {
			if (field.meta?.special?.includes('o2m') || field.meta?.special?.includes('m2m') || field.meta?.special?.includes('m2a')) {
				const rel = data.relations.find((r) =>
					r.meta?.one_collection === field.collection
					&& r.meta.one_field === field.field
				);

				if (rel) {
					fieldRelation = {
						collection: rel.collection,
						mutliple: true
					};

					// @ts-ignore
					mappedType = fieldTypeMap.get(data.fields.find((f) => f.collection === field.collection && f.schema?.is_primary_key)?.type)!;
				}

			}
		}

		if (mappedType === undefined) {
			continue;
		}

		// check one to any relations
		if (fieldRelation == null) {
			const rel = data.relations.find((r) =>
				r.field === field.field && r.collection === field.collection
			)

			if (rel) {
				// m2o relations
				if (rel.related_collection) {
					fieldRelation = {
						collection: rel.related_collection,
						mutliple: false,
					};
				}

				// m2a relations
				if (rel.meta?.one_allowed_collections) {
					fieldRelation = rel.meta.one_allowed_collections.map((collectionName) => ({
						collection: collectionName,
						mutliple: false,
					}));
				}
			}
		}

		// check for m2a collection fields
		if (field.field === 'collection') {
			const rel = data.relations.find((r) => r.collection === field.collection && r.field === 'item');

			if (rel && rel.meta?.one_allowed_collections) {
				mappedType = rel.meta.one_allowed_collections.map(c => `'${c}'`);
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
