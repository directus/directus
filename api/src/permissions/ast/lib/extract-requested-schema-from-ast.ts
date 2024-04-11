import type { AST, FieldNode, FunctionFieldNode, NestedCollectionNode } from '../../../types/ast.js';
import type { FieldKey, FieldMap } from '../types.js';

export function extractRequestedSchemaFromAst(ast: AST | NestedCollectionNode): FieldMap {
	const fieldMapWithDuplicates: Record<string, string[]> = {};

	if (ast.type === 'a2o') {
		ast.names.forEach((collection) => {
			if (!fieldMapWithDuplicates[collection]) {
				fieldMapWithDuplicates[collection] = [];
			}

			if (ast.children[collection]) {
				fieldMapWithDuplicates[collection]!.push(...extractFields(ast.children[collection]!));
			}
		});

		return fieldMap;
	}

	const set = ensureSet(fieldMap, ast.name);
	set.add(extractFields(ast.children));

	return fieldMap;
}

/**
 * Ensure the passed collection has an existing Set in the fieldMap
 * Mutates fieldMap
 */
export function ensureSet(fieldMap: FieldMap, collection: string): Set<FieldKey> {
	if (fieldMap.has(collection) === false) {
		fieldMap.set(collection, new Set());
	}

	return fieldMap.get(collection)!;
}

export function extractFieldsFromChildren(children: (NestedCollectionNode | FieldNode | FunctionFieldNode)[]): string[] {
	return [];
}
