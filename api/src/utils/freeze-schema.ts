import type { SchemaOverview } from '@directus/types';
import { cloneDeep } from 'lodash-es';

export function freezeSchema(schema: SchemaOverview): Readonly<SchemaOverview> {
	// freeze collections
	for (const collectionName of Object.keys(schema.collections)) {
		if (!schema.collections[collectionName]) continue;

		for (const fieldName of Object.keys(schema.collections[collectionName].fields)) {
			Object.freeze(schema.collections[collectionName].fields[fieldName]);
		}

		Object.freeze(schema.collections[collectionName]);
	}

	Object.freeze(schema.collections);

	// freeze relations
	for (const relation of schema.relations) {
		if (relation.schema) Object.freeze(relation.schema);
		if (relation.meta) Object.freeze(relation.meta);

		Object.freeze(relation);
	}

	Object.freeze(schema.relations);

	return Object.freeze(schema);
}

export function unfreezeSchema(schema: Readonly<SchemaOverview>): SchemaOverview {
	if (Object.isFrozen(schema)) {
		return cloneDeep(schema);
	} else {
		return schema;
	}
}
