import type { SchemaOverview } from '@directus/types';
import type { AST, FieldNode, FunctionFieldNode, NestedCollectionNode } from '../../../../types/ast.js';
import { getAstLevels } from '../../../../utils/get-ast-levels.js';
import { getUnaliasedFieldKey } from '../../../utils/get-unaliased-field-key.js';
import type { FieldMap, QueryPath } from '../types.js';
import { getInfoForPath } from '../utils/get-info-for-path.js';
import { extractFieldsFromQuery } from './extract-fields-from-query.js';

/**
 * Add the fields the children read to the field map, together with the fields the queries of nested nodes read
 */
export function extractFieldsFromChildren(
	collection: string,
	children: (NestedCollectionNode | FieldNode | FunctionFieldNode)[],
	fieldMap: FieldMap,
	schema: SchemaOverview,
	path: QueryPath = [],
) {
	const ast: AST = { type: 'root', name: collection, children, query: {}, cases: [] };

	for (const level of getAstLevels(ast, path)) {
		const info = getInfoForPath(fieldMap, 'other', level.path, level.collection);

		for (const child of level.children) {
			info.fields.add(getUnaliasedFieldKey(child));

			if (child.type === 'functionField') {
				// functionFields operate on a related o2m collection, we have to make sure we include a
				// no-field read check to the related collection
				const childPath = [...level.path, child.fieldKey];

				getInfoForPath(fieldMap, 'other', childPath, child.relatedCollection);
				extractFieldsFromQuery(child.relatedCollection, child.query, fieldMap, schema, childPath);
			}
		}

		// The query of the root is extracted separately
		if (level.parent && level.query)
			extractFieldsFromQuery(level.collection, level.query, fieldMap, schema, level.path);
	}
}
