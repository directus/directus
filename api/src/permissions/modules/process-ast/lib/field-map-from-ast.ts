import type { AST } from '../../../../types/ast.js';
import type { FieldMap } from '../types.js';
import { extractFieldsFromChildren } from './extract-fields-from-children.js';
import { extractFieldsFromQuery } from './extract-fields-from-query.js';
import type { SchemaOverview } from '@directus/types';

export function fieldMapFromAst(ast: AST, schema: SchemaOverview): FieldMap {
	const fieldMap: FieldMap = { read: new Map(), other: new Map() };

	extractFieldsFromChildren(ast.name, ast.children, fieldMap, schema);
	extractFieldsFromQuery(ast.name, ast.query, fieldMap, schema);

	return fieldMap;
}
