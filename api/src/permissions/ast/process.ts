import type { PermissionsAction } from '@directus/system-data';
import type { Accountability } from '@directus/types';
import type { AST } from '../../types/ast.js';
import { extractRequestedSchemaFromAst } from './lib/extract-requested-schema-from-ast.js';
import type { FieldMap } from './types.js';

/**
 * Permissions validation strategy (READ):
 *
 * - AST + action + ip/role/user comes in
 * - Extract collections and fields within those collections used in AST
 * - Find policies for role (+ parents) + user
 * - Filter policies down by IP access
 * - Find permissions in remaining policies by collection + action
 * - Validate if field permissions exist for requested data
 * - Inject item access rules to AST
 */

export async function process(
	ast: AST,
	action: PermissionsAction,
	accountability: Accountability,
) {
	const requestedSchema: FieldMap = extractRequestedSchemaFromAst(ast);

	// const collections = requestedSchema.keys();
	// const permissions = await getPermissions(collections, action, accountability);

	// validateAst(ast, permissions);

	// return injectAccessRules(ast, permissions);
}
