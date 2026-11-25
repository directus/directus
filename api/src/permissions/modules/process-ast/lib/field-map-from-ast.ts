import type { SchemaOverview } from '@directus/types';
import type { AST } from '../../../../types/ast.js';
import { getAstLevels } from '../../../../utils/get-ast-levels.js';
import { getUnaliasedFieldKey } from '../../../utils/get-unaliased-field-key.js';
import type { FieldMap } from '../types.js';
import { getInfoForPath } from '../utils/get-info-for-path.js';
import { extractFieldsFromQuery } from './extract-fields-from-query.js';

/**
 * Collect every field the AST touches, grouped by query path, so it can be validated against the schema and the
 * permissions before the AST is run. Fields that are fetched or used in `aggregate`/`group` land in `other` and require
 * permission for the action of the request; fields only used in `filter`/`sort` land in `read` and only require read
 * permission.
 *
 * Fields are collected for every level of the AST (see `getAstLevels`): the fields its children fetch and the fields
 * its query uses.
 *
 * For example, `fields=title,author.name&filter[category][name][_eq]=News` on `articles` results in:
 *
 * ```
 * other: '' → articles { title, author }, 'author' → authors { name }
 * read:  '' → articles { category }, 'category' → categories { name }
 * ```
 */
export function fieldMapFromAst(ast: AST, schema: SchemaOverview): FieldMap {
	const fieldMap: FieldMap = { read: new Map(), other: new Map() };

	for (const { path, collection, children, query } of getAstLevels(ast)) {
		const info = getInfoForPath(fieldMap, 'other', path, collection);

		for (const child of children) {
			info.fields.add(getUnaliasedFieldKey(child));

			// Function fields read a related o2m collection, which requires read access to it
			if (child.type === 'functionField') {
				const childPath = [...path, child.fieldKey];

				getInfoForPath(fieldMap, 'other', childPath, child.relatedCollection);
				extractFieldsFromQuery(child.relatedCollection, child.query, fieldMap, schema, childPath);
			}
		}

		extractFieldsFromQuery(collection, query, fieldMap, schema, path);
	}

	return fieldMap;
}
