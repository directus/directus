import type { Accountability, PermissionsAction } from '@directus/types';
import type { AST } from '../../../types/ast.js';
import { getAstLevels } from '../../../utils/get-ast-levels.js';
import { getCollectionVersioning } from '../../../versioning/schema.js';
import { fetchPermissions } from '../../lib/fetch-permissions.js';
import { fetchPolicies } from '../../lib/fetch-policies.js';
import type { Context } from '../../types.js';
import { assertCollectionActive } from '../assert-collection-active/assert-collection-active.js';
import { fieldMapFromAst } from './lib/field-map-from-ast.js';
import { collectionsInFieldMap, fieldMapEntries } from './lib/field-map.js';
import { injectCases } from './lib/inject-cases.js';
import { validatePathExistence } from './utils/validate-path/validate-path-existence.js';
import { validatePathPermissions } from './utils/validate-path/validate-path-permissions.js';

export interface ProcessAstOptions {
	ast: AST;
	action: PermissionsAction;
	accountability: Accountability | null;
}

/**
 * Second step of reading data: validates an AST from `getAstFromQuery` against the schema and the
 * accountability's permissions, before it is executed with `runAst`.
 * Throws if a requested field doesn't exist, a traversed collection is inactive, or access is missing
 * (including read access to the shadow tables of versioned nodes and the fields their filters read from them).
 * For non-admins, also injects the permission rules as `cases` into the AST, which `runAst` uses to
 * restrict rows and null out fields the user may not see. Mutates and returns the given AST.
 */
export async function processAst(options: ProcessAstOptions, context: Context) {
	// FieldMap is a Map of paths in the AST, with each path containing the collection and fields in
	// that collection that the AST path tries to access
	const fieldMap = fieldMapFromAst(options.ast, context.schema);
	const collections = collectionsInFieldMap(fieldMap);

	// Every collection the query traverses into has to be active, not just the one it is addressed at.
	for (const collection of collections) {
		await assertCollectionActive(
			{ accountability: options.accountability, action: options.action, collection },
			context,
		);
	}

	if (!options.accountability || options.accountability.admin) {
		// Validate the field existence, even if no permissions apply to the current accountability
		for (const [path, { collection, fields }] of fieldMapEntries(fieldMap)) {
			validatePathExistence(path, collection, fields, context.schema);
		}

		return options.ast;
	}

	const policies = await fetchPolicies(options.accountability, context);

	const shadows: { path: string; shadow: string; fields: Set<string> }[] = [];

	for (const { path, collection, versioning } of getAstLevels(options.ast)) {
		if (!versioning) continue;

		// The version rows of the level are read from its own shadow table
		const own = getCollectionVersioning(context.schema, collection).shadow?.collection;
		const levelShadows = { ...(own ? { [own]: [] } : {}), ...versioning.shadows };

		for (const [shadow, fields] of Object.entries(levelShadows)) {
			shadows.push({ path: path.join('.'), shadow, fields: new Set(fields) });
			collections.add(shadow);
		}
	}

	const permissions = await fetchPermissions(
		{ action: options.action, policies, collections: [...collections], accountability: options.accountability },
		context,
	);

	const readPermissions =
		options.action === 'read'
			? permissions
			: await fetchPermissions(
					{ action: 'read', policies, collections: [...collections], accountability: options.accountability },
					context,
				);

	// Validate field existence first
	for (const [path, { collection, fields }] of fieldMapEntries(fieldMap)) {
		validatePathExistence(path, collection, fields, context.schema);
	}

	// Validate permissions for the fields
	for (const [path, { collection, fields }] of fieldMap.action.entries()) {
		validatePathPermissions(path, permissions, collection, fields);
	}

	// Validate permission for read only fields
	for (const [path, { collection, fields }] of fieldMap.read.entries()) {
		validatePathPermissions(path, readPermissions, collection, fields);
	}

	// Shadow tables aren't part of the field map, as their version rows and the versions filters reach are read
	// through the versioned read collection
	for (const { path, shadow, fields } of shadows) {
		validatePathPermissions(path, readPermissions, shadow, fields);
	}

	injectCases(options.ast, permissions, context.schema);

	return options.ast;
}
