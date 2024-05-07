import type { PermissionsAction } from '@directus/system-data';
import type { Accountability, SchemaOverview } from '@directus/types';
import type { AccessService } from '../../../services/access.js';
import type { PermissionsService } from '../../../services/index.js';
import type { AST } from '../../../types/ast.js';
import { fetchPermissions } from '../../lib/fetch-permissions.js';
import { fetchPolicies } from '../../lib/fetch-policies.js';
import { fieldMapFromAst } from './lib/field-map-from-ast.js';
import { injectCases } from './lib/inject-cases.js';
import type { FieldMap } from './types.js';
import { collectionsInFieldMap } from './utils/collections-in-field-map.js';
import { validatePath } from './utils/validate-path.js';

export async function processAst(
	accessService: AccessService,
	permissionsService: PermissionsService,
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

	const policies = await fetchPolicies(accountability, accessService);

	// FieldMap is a Map of paths in the AST, with each path containing the collection and fields in
	// that collection that the AST path tries to access
	const fieldMap: FieldMap = fieldMapFromAst(ast, schema);
	const collections = collectionsInFieldMap(fieldMap);
	const permissions = await fetchPermissions({ action, policies, collections }, { permissionsService });

	for (const [path, { collection, fields }] of fieldMap.entries()) {
		validatePath(path, permissions, collection, fields);
	}

	injectCases(ast, permissions);

	return ast;
}
