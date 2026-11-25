import type { SchemaOverview } from '@directus/types';
import type { AST } from '../../../../types/ast.js';
import { extractFunctionName } from '../../../../utils/extract-function-name.js';
import { getAstLevels } from '../../../../utils/get-ast-levels.js';
import { getUnaliasedFieldKey } from '../../../utils/get-unaliased-field-key.js';
import { extractFieldsFromQuery } from './extract-fields-from-query.js';
import { addToFieldMap, createFieldMap, type FieldMap } from './field-map.js';

/**
 * Collect every field the AST touches, grouped by query path, so it can be validated against the schema and the
 * permissions before the AST is run. Fields that are fetched or used in `aggregate`/`group` land in `action` and require
 * permission for the action of the request; fields only used in `filter`/`sort` land in `read` and only require read
 * permission.
 *
 * Fields are collected for every level of the AST (see `getAstLevels`): the fields its children fetch and the fields
 * its query uses.
 *
 * For example, `fields=title,author.name&filter[category][name][_eq]=News` on `articles` results in:
 *
 * ```
 * action: '' → articles { title, author }, 'author' → authors { name }
 * read:   '' → articles { category }, 'category' → categories { name }
 * ```
 */
export function fieldMapFromAst(ast: AST, schema: SchemaOverview): FieldMap {
	const fieldMap = createFieldMap();

	for (const { path, collection, children, query } of getAstLevels(ast)) {
		addToFieldMap(fieldMap, 'action', path, collection);

		for (const child of children) {
			addToFieldMap(fieldMap, 'action', path, collection, getUnaliasedFieldKey(child));

			// Relational counts read the related o2m collection, which requires access to it and its permissions to be
			// loaded for the cases of the count
			if (child.type === 'functionField' && extractFunctionName(child.name) !== 'json') {
				addToFieldMap(fieldMap, 'action', [...path, child.fieldKey], child.relatedCollection);
			}
		}

		extractFieldsFromQuery(collection, query, fieldMap, schema, path);
	}

	return fieldMap;
}
