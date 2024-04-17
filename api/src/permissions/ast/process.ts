import type { PermissionsAction } from '@directus/system-data';
import type { Accountability, Permission, SchemaOverview } from '@directus/types';
import { getDatabase } from '../../database/index.js';
import { AccessService } from '../../services/access.js';
import { PermissionsService } from '../../services/permissions/index.js';
import { RolesService } from '../../services/roles.js';
import type { AST } from '../../types/ast.js';
import { fieldMapFromAst } from './lib/field-map-from-ast.js';
import { injectCases } from './lib/inject-cases.js';
import type { FieldMap } from './types.js';
import { collectionsInFieldMap } from './utils/collections-in-field-map.js';
import { fetchPolicies } from './utils/fetch-policies.js';
import { fetchRolesTree } from './utils/fetch-roles-tree.js';
import { filterPoliciesByIp } from './utils/filter-policies-by-ip.js';
import { orderPoliciesByPriority } from './utils/order-policies-by-priority.js';
import { validatePath } from './utils/validate-path.js';

export async function processAst(
	ast: AST,
	action: PermissionsAction,
	accountability: Accountability,
	schema: SchemaOverview,
) {
	const knex = getDatabase();

	const rolesService = new RolesService({ schema, knex });
	const permissionsService = new PermissionsService({ schema, knex });
	const accessService = new AccessService({ schema, knex });

	// TODO maybe move roles+policies fetching/filtering to middleware so it's available as
	// accountability.admin still to avoid a massive refactor?

	const isPublic = accountability.role === null;

	// All roles in the current role's parent tree, ordered by specificity (parent -> child)
	const roles = await fetchRolesTree(rolesService, accountability.role);

	// All policies related to the current accountability, filtered down by IP, sorted from least to
	// most priority
	let policies = await fetchPolicies(accessService, isPublic, roles, accountability.user);
	policies = filterPoliciesByIp(policies, accountability.ip);

	// TODO remove order, no longer necessary
	policies = orderPoliciesByPriority(policies, roles);

	const isAdmin = policies.some(({ policy }) => policy.admin_access);

	if (isAdmin) {
		return ast;
	}

	// FieldMap is a Map of paths in the AST, with each path containing the collection and fields in
	// that collection that the AST path tries to access
	const fieldMap: FieldMap = fieldMapFromAst(ast, schema);
	const collections = collectionsInFieldMap(fieldMap);

	// Fetch permissions nested with policies by collection+action
	const permissions = (await permissionsService.readByQuery({
		filter: {
			_and: [
				{ policy: { _in: policies.map(({ policy }) => policy.id) } },
				{ collection: { _in: Array.from(collections) } },
				{ action: { _eq: action } },
			],
		},
	})) as Permission[];

	for (const [path, { collection, fields }] of fieldMap.entries()) {
		validatePath(path, permissions, collection, fields);
	}

	injectCases(ast, permissions);

	return ast;
}
