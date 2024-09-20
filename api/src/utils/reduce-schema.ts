import type { SchemaOverview } from '@directus/types';
import type { FieldMap } from '../permissions/modules/fetch-allowed-field-map/fetch-allowed-field-map.js';

/**
 * Reduces the schema based on the included permissions. The resulting object is the schema structure, but with only
 * the allowed collections/fields/relations included based on the passed field map.
 */
export function reduceSchema(schema: SchemaOverview, fieldMap: FieldMap): SchemaOverview {
	const reduced: SchemaOverview = {
		collections: {},
		relations: [],
	};

	for (const [collectionName, collection] of Object.entries(schema.collections)) {
		if (!fieldMap[collectionName]) {
			// Collection is not allowed at all
			continue;
		}

		const fields: SchemaOverview['collections'][string]['fields'] = {};

		for (const [fieldName, field] of Object.entries(schema.collections[collectionName]!.fields)) {
			if (!fieldMap[collectionName]?.includes('*') && !fieldMap[collectionName]?.includes(fieldName)) {
				continue;
			}

			const o2mRelation = schema.relations.find(
				(relation) => relation.related_collection === collectionName && relation.meta?.one_field === fieldName,
			);

			if (o2mRelation && !fieldMap[collectionName]) {
				continue;
			}

			fields[fieldName] = field;
		}

		reduced.collections[collectionName] = {
			...collection,
			fields,
		};
	}

	reduced.relations = schema.relations.filter((relation) => {
		let collectionsAllowed = true;
		let fieldsAllowed = true;

		if (Object.keys(fieldMap).includes(relation.collection) === false) {
			collectionsAllowed = false;
		}

		if (
			relation.related_collection &&
			(Object.keys(fieldMap).includes(relation.related_collection) === false ||
				// Ignore legacy permissions with an empty fields array
				fieldMap[relation.related_collection]?.length === 0)
		) {
			collectionsAllowed = false;
		}

		if (
			relation.meta?.one_allowed_collections &&
			relation.meta.one_allowed_collections.every((collection) => Object.keys(fieldMap).includes(collection)) === false
		) {
			collectionsAllowed = false;
		}

		if (
			!fieldMap[relation.collection] ||
			(fieldMap[relation.collection]?.includes('*') === false &&
				fieldMap[relation.collection]?.includes(relation.field) === false)
		) {
			fieldsAllowed = false;
		}

		if (
			relation.related_collection &&
			relation.meta?.one_field &&
			(!fieldMap[relation.related_collection] ||
				(fieldMap[relation.related_collection]?.includes('*') === false &&
					fieldMap[relation.related_collection]?.includes(relation.meta?.one_field) === false))
		) {
			fieldsAllowed = false;
		}

		return collectionsAllowed && fieldsAllowed;
	});

	return reduced;
}
