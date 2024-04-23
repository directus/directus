import type { PermissionsAction } from '@directus/system-data';
import type { Accountability, Permission, SchemaOverview } from '@directus/types';
import { getDatabase } from '../../../database/index.js';
import { AccessService } from '../../../services/access.js';
import { PermissionsService } from '../../../services/permissions/index.js';
import type { AST } from '../../../types/ast.js';
import { fetchPolicies } from '../../lib/fetch-policies.js';
import { fieldMapFromAst } from './lib/field-map-from-ast.js';
import { injectCases } from './lib/inject-cases.js';
import type { FieldMap } from './types.js';
import { collectionsInFieldMap } from './utils/collections-in-field-map.js';
import { validatePath } from './utils/validate-path.js';

export async function processAst(
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

	// TODO this might have to be a parameter as well to support this process being used in nested
	// transactions
	const knex = getDatabase();

	const permissionsService = new PermissionsService({ schema, knex });
	const accessService = new AccessService({ schema, knex });

	const policies = await fetchPolicies(accessService, accountability);

	// FieldMap is a Map of paths in the AST, with each path containing the collection and fields in
	// that collection that the AST path tries to access
	const fieldMap: FieldMap = fieldMapFromAst(ast, schema);
	const collections = collectionsInFieldMap(fieldMap);

	// Fetch permissions nested with policies by collection+action
	const permissions = (await permissionsService.readByQuery({
		filter: {
			_and: [
				{ policy: { _in: policies } },
				{ collection: { _in: Array.from(collections) } },
				{ action: { _eq: action } },
			],
		},
		limit: -1,
	})) as Permission[];

	for (const [path, { collection, fields }] of fieldMap.entries()) {
		validatePath(path, permissions, collection, fields);
	}

	injectCases(ast, permissions);

	return ast;
}
