import type { SchemaOverview } from '@directus/types';
import type { FieldNode, FunctionFieldNode, NestedCollectionNode } from '../../../../types/ast.js';
import { getUnaliasedFieldKey } from '../../../utils/get-unaliased-field-key.js';
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
	const info = getInfoForPath(fieldMap, 'other', path, collection);

	for (const child of children) {
		info.fields.add(getUnaliasedFieldKey(child));

		if (child.type === 'a2o') {
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
			extractFieldsFromChildren(child.relation.related_collection!, child.children, fieldMap, schema, [
				...path,
				child.fieldKey,
			]);

			extractFieldsFromQuery(child.relation.related_collection!, child.query, fieldMap, schema, [
				...path,
				child.fieldKey,
			]);
		} else if (child.type === 'o2m') {
			extractFieldsFromChildren(child.relation.collection!, child.children, fieldMap, schema, [
				...path,
				child.fieldKey,
			]);

			extractFieldsFromQuery(child.relation.collection!, child.query, fieldMap, schema, [...path, child.fieldKey]);
		} else if (child.type === 'functionField') {
			// functionFields operate on a related o2m collection, we have to make sure we include a
			// no-field read check to the related collection
			extractFieldsFromChildren(child.relatedCollection, [], fieldMap, schema, [...path, child.fieldKey]);
			extractFieldsFromQuery(child.relatedCollection, child.query, fieldMap, schema, [...path, child.fieldKey]);

			// For relational JSON functions, also validate the JSON field on the target collection
			if (child.relationalJsonContext) {
				const relatedInfo = getInfoForPath(fieldMap, 'other', [...path, child.fieldKey], child.relatedCollection);
				relatedInfo.fields.add(child.relationalJsonContext.jsonField);
			}
		}
	}
}
