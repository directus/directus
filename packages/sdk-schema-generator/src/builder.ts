import type { BuilderOptions, FieldDefinition, SchemaDefinition } from './types.js';
import { fieldTypeMap } from './constants.js';
import { getNamingFn } from './naming.js';
import type { FieldOverview, SchemaOverview } from '@directus/types';

const defaultOptions: BuilderOptions = {
	nameTransform: 'database',
};

export function buildSchema(data: SchemaOverview, options = defaultOptions) {
	const nameFn = getNamingFn(options.nameTransform);
	const result: SchemaDefinition = new Map();

	// setup the collections
	for (const collection of Object.values(data.collections)) {
		if (result.has(collection.collection)) {
			continue;
		}

		const systemCollection = collection.collection.startsWith('directus_');

		const collectionName = systemCollection
			? collection.collection
			: nameFn(collection.collection);


		result.set(collection.collection, {
			name: collectionName,
			system: systemCollection,
			singleton: Boolean(collection.singleton),
			fields: Object.values(collection.fields).map((field) => {
				let mappedType: string[] | string | undefined = fieldTypeMap[field.type];
				let fieldRelation: FieldDefinition['relation'] = null;

				if (systemCollection && field.generated) {
					return null;
				}

				// check many to any relations
				if (isRelationAlias(field)) {
					const relation = data.relations.find(
						({ meta }) => meta?.one_collection === collection.collection && meta?.one_field === field.field
					);

					const primaryKey = collection.fields[collection.primary];

					if (relation && primaryKey) {
						fieldRelation = { collection: relation.collection, mutliple: true };
						mappedType = fieldTypeMap[primaryKey.type] + '[]';
					}
				}

				if (mappedType === undefined) {
					return null;
				}

				// check one to any relations
				if (fieldRelation == null) {
					const relation = data.relations.find((rel) => rel.field === field.field && rel.collection === collection.collection);

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
					const rel = data.relations.find((r) => r.collection === collection.collection && r.field === 'item');

					if (rel && rel.meta?.one_allowed_collections) {
						mappedType = rel.meta.one_allowed_collections.map((c) => `'${c}'`);
					}
				}

				return {
					name: field.field,
					type: mappedType!,
					nullable: Boolean(field.nullable),
					primary_key: collection.primary === field.field,
					relation: fieldRelation,
				};
			}).filter(x => Boolean(x)) as FieldDefinition[],
		});
	}

	// clean up untouched system collections or those without fields
	for (const [name, collection] of result) {
		if (collection.fields.length === 0) {
			result.delete(name);
		}
	}

	return result;
}

function isRelationAlias(field: FieldOverview): boolean {
	if (field.type !== 'alias' || !field.special) {
		return false;
	}

	const isRelationField = ['o2m', 'm2m', 'm2a'].some((type) => field.special.includes(type));

	return isRelationField;
}
