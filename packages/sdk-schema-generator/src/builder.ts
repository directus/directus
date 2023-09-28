import type { BuilderOptions, DataModel, FieldDefinition, SchemaDefinition } from './types.js';
import { fieldTypeMap } from './constants.js';
import { getNamingFn } from './naming.js';
import type { Field } from '@directus/types';

const defaultOptions: BuilderOptions = {
	nameTransform: 'database',
};

export function buildSchema(data: DataModel, options = defaultOptions) {
	const nameFn = getNamingFn(options.nameTransform);
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

		let mappedType: string[] | string | undefined = fieldTypeMap[field.type];
		let fieldRelation: FieldDefinition['relation'] = null;

		// check many to any relations
		if (isRelationAlias(field)) {
			const relation = data.relations.find(
				({ meta }) => meta?.one_collection === field.collection && meta?.one_field === field.field
			);

			const primaryKey = data.fields.find(
				({ collection, schema }) => collection === field.collection && schema?.is_primary_key
			);

			if (relation && primaryKey) {
				fieldRelation = { collection: relation.collection, mutliple: true };
				mappedType = fieldTypeMap[primaryKey.type];
			}
		}

		if (mappedType === undefined) {
			continue;
		}

		// check one to any relations
		if (fieldRelation == null) {
			const relation = data.relations.find((rel) => rel.field === field.field && rel.collection === field.collection);

			if (relation) {
				// m2o relations
				if (relation.related_collection) {
					fieldRelation = { collection: relation.related_collection, mutliple: false };
				}

				// m2a relations
				if (relation.meta?.one_allowed_collections) {
					fieldRelation = relation.meta.one_allowed_collections.map((collectionName) => ({
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
				mappedType = rel.meta.one_allowed_collections.map((c) => `'${c}'`);
			}
		}

		collection.fields.push({
			name: field.field,
			type: mappedType!,
			nullable: Boolean(field.schema?.is_nullable),
			primary_key: Boolean(field.schema?.is_primary_key),
			relation: fieldRelation,
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

function isRelationAlias(field: Field): boolean {
	if (field.type !== 'alias' || !field.meta?.special) {
		return false;
	}

	const fieldSpecial = field.meta.special;
	const isRelationField = ['o2m', 'm2m', 'm2a'].some((type) => fieldSpecial.includes(type));

	return isRelationField;
}
