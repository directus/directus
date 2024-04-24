import type { PermissionsAction } from '@directus/system-data';
import type { Accountability, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import type { AST } from '../../../types/ast.js';
import { fetchPermissions } from '../../lib/fetch-permissions.js';
import { fetchPolicies } from '../../lib/fetch-policies.js';
import { fieldMapFromAst } from './lib/field-map-from-ast.js';
import { injectCases } from './lib/inject-cases.js';
import type { FieldMap } from './types.js';
import { collectionsInFieldMap } from './utils/collections-in-field-map.js';
import { validatePath } from './utils/validate-path.js';

export async function processAst(
	knex: Knex,
	ast: AST,
	action: PermissionsAction,
	accountability: Accountability | null,
	schema: SchemaOverview,
) {
	if (!accountability || accountability.admin) {
		// TODO this should still go through validatePath to check for non-existing
		// collections/fields
		return ast;
	}

	const policies = await fetchPolicies(knex, schema, accountability);

	// FieldMap is a Map of paths in the AST, with each path containing the collection and fields in
	// that collection that the AST path tries to access
	const fieldMap: FieldMap = fieldMapFromAst(ast, schema);
	const collections = collectionsInFieldMap(fieldMap);
	const permissions = await fetchPermissions(knex, schema, action, policies, collections);

	for (const [path, { collection, fields }] of fieldMap.entries()) {
		validatePath(path, permissions, collection, fields);
	}

	injectCases(ast, permissions);

	return ast;
}
