import type { PermissionsAction } from '@directus/system-data';
import type { Accountability, SchemaOverview } from '@directus/types';
import { getDatabase } from '../../database/index.js';
import { AccessService } from '../../services/access.js';
import { RolesService } from '../../services/roles.js';
import type { AST } from '../../types/ast.js';
import { fieldMapFromAst } from './lib/field-map-from-ast.js';
import type { FieldMap } from './types.js';
import { collectionsInFieldMap } from './utils/collections-in-field-map.js';
import { fetchRolesTree } from './utils/fetch-roles-tree.js';

export async function process(
	ast: AST,
	action: PermissionsAction,
	accountability: Accountability,
	schema: SchemaOverview,
) {
	const rolesService = new RolesService({
		schema,
		knex: getDatabase(),
	});

	const roles = await fetchRolesTree(rolesService, accountability.role);

	// If roles length == 1 use policies for role `null`

	// Fetch all policies (id, ip, admin) nested through accessService where role is in roles, user
	// is user

	// Check if a policy contains admin, exit early

	// Filter policies down by IP address access

	// Fetch permissions nested with policies by collection+action

	// Sort policies by priority (global defaults -> role -> user)

	// Validate fieldMap against fetched permissions

	const accessService = new AccessService({
		schema,
		knex: getDatabase(),
	});

	const fieldMap: FieldMap = fieldMapFromAst(ast, schema);
	const collections = collectionsInFieldMap(fieldMap);

	// Inject read access filter rules in ast

	// return, ?, profit
}
