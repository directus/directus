import type { SchemaOverview } from '@directus/types';
import type { FieldNode, FunctionFieldNode, NestedCollectionNode } from '../../../../types/ast.js';
import { stripFunction } from '../../../../utils/strip-function.js';
import type { FieldMap, QueryPath } from '../types.js';
import { formatA2oKey } from '../utils/format-a2o-key.js';
import { getInfoForPath } from '../utils/get-info-for-path.js';
import { extractFieldsFromQuery } from './extract-fields-from-query.js';

export function extractFieldsFromChildren(
	collection: string,
	children: (NestedCollectionNode | FieldNode | FunctionFieldNode)[],
	fieldMap: FieldMap,
	schema: SchemaOverview,
	path: QueryPath = [],
) {
	const info = getInfoForPath(fieldMap, path, collection);

	for (const child of children) {
		if (child.type === 'a2o') {
			info.fields.add(child.fieldKey);

			for (const [collection, children] of Object.entries(child.children)) {
				extractFieldsFromChildren(collection, children, fieldMap, schema, [
					...path,
					formatA2oKey(child.fieldKey, collection),
				]);
			}

			if (child.query) {
				for (const [collection, query] of Object.entries(child.query)) {
					extractFieldsFromQuery(collection, query, fieldMap, schema, [
						...path,
						formatA2oKey(child.fieldKey, collection),
					]);
				}
			}
		} else if (child.type === 'm2o') {
			info.fields.add(child.fieldKey);

			extractFieldsFromChildren(child.relation.collection, child.children, fieldMap, schema, [...path, child.fieldKey]);
			extractFieldsFromQuery(child.relation.collection, child.query, fieldMap, schema, [...path, child.fieldKey]);
		} else if (child.type === 'o2m') {
			info.fields.add(child.fieldKey);

			extractFieldsFromChildren(child.relation.related_collection!, child.children, fieldMap, schema, [
				...path,
				child.fieldKey,
			]);

			extractFieldsFromQuery(child.relation.related_collection!, child.query, fieldMap, schema, [
				...path,
				child.fieldKey,
			]);
		} else if (child.type === 'functionField') {
			info.fields.add(stripFunction(child.fieldKey));

			// functionFields operate on a related o2m collection, we have to make sure we include a
			// no-field read check to the related collection
			extractFieldsFromChildren(child.relatedCollection, [], fieldMap, schema, [...path, child.fieldKey]);
			extractFieldsFromQuery(child.relatedCollection, child.query, fieldMap, schema, [...path, child.fieldKey]);
		} else {
			info.fields.add(stripFunction(child.fieldKey));
		}
	}
}
