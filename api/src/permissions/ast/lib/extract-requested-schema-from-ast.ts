import type { AST, FieldNode, FunctionFieldNode, NestedCollectionNode } from '../../../types/ast.js';
import type { FieldMap } from '../types.js';
import { dedupeFieldMap } from '../utils/dedupe-field-map.js';
import { ensureFields } from '../utils/ensure-fields.js';
import { formatA2oKey } from '../utils/format-a2o-key.js';

export function extractRequestedSchemaFromAst(
	ast: AST | NestedCollectionNode,
	fieldMap: FieldMap = {},
	path: string[] = [],
): FieldMap {
	// TODO pull fields from query (sort/filter)

	if (ast.type === 'a2o') {
		for (const [collection, children] of Object.entries(ast.children)) {
			extractFieldsFromChildren(
				collection,
				children,
				fieldMap,
				(path = [...path, formatA2oKey(ast.fieldKey, collection)]),
			);
		}

		return fieldMap;
	}

	extractFieldsFromChildren(ast.name, ast.children, fieldMap, path);

	// Deduplicate the fields per collection, but only do it on the root so we save some perf
	// overhead by not having to loop over the map every nested recursion
	if (ast.type === 'root') {
		dedupeFieldMap(fieldMap);
	}

	return fieldMap;
}

export function extractFieldsFromChildren(
	collection: string,
	children: (NestedCollectionNode | FieldNode | FunctionFieldNode)[],
	fieldMap: FieldMap,
	path: string[],
) {
	for (const child of children) {
		const isRelational = ['m2o', 'o2m', 'a2o'].includes(child.type);

		if (isRelational) {
			extractRequestedSchemaFromAst(child as NestedCollectionNode, fieldMap, (path = [...path, child.fieldKey]));
		} else {
			ensureFields(fieldMap, collection);
			// TODO Might have to remove the function wrapping if exists
			fieldMap[collection]!.push(child.fieldKey);
		}
	}
}
