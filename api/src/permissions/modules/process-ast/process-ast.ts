import type { Accountability, PermissionsAction } from '@directus/types';
import type { AST, NestedCollectionNode } from '../../../types/ast.js';
import { getVersionTablesSchema } from '../../../versioning/schema.js';
import { fetchPermissions } from '../../lib/fetch-permissions.js';
import { fetchPolicies } from '../../lib/fetch-policies.js';
import type { Context } from '../../types.js';
import { assertCollectionActive } from '../assert-collection-active/assert-collection-active.js';
import { validateAccess } from '../validate-access/validate-access.js';
import { fieldMapFromAst } from './lib/field-map-from-ast.js';
import { injectCases } from './lib/inject-cases.js';
import type { FieldMap } from './types.js';
import { collectionsInFieldMap } from './utils/collections-in-field-map.js';
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
 * (including read access to the shadow tables of versioned nodes).
 * For non-admins, also injects the permission rules as `cases` into the AST, which `runAst` uses to
 * restrict rows and null out fields the user may not see. Mutates and returns the given AST.
 */
export async function processAst(options: ProcessAstOptions, context: Context) {
	if (options.accountability && !options.accountability.admin) {
		const tablesContext = { ...context, schema: getVersionTablesSchema(context.schema) };

		for (const collection of getVersionedShadows(options.ast)) {
			await validateAccess({ accountability: options.accountability, action: 'read', collection }, tablesContext);
		}
	}

	// FieldMap is a Map of paths in the AST, with each path containing the collection and fields in
	// that collection that the AST path tries to access
	const fieldMap: FieldMap = fieldMapFromAst(options.ast, context.schema);
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
		for (const [path, { collection, fields }] of [...fieldMap.read.entries(), ...fieldMap.other.entries()]) {
			validatePathExistence(path, collection, fields, context.schema);
		}

		return options.ast;
	}

	const policies = await fetchPolicies(options.accountability, context);

	const permissions = await fetchPermissions(
		{ action: options.action, policies, collections, accountability: options.accountability },
		context,
	);

	const readPermissions =
		options.action === 'read'
			? permissions
			: await fetchPermissions(
					{ action: 'read', policies, collections, accountability: options.accountability },
					context,
				);

	// Validate field existence first
	for (const [path, { collection, fields }] of [...fieldMap.read.entries(), ...fieldMap.other.entries()]) {
		validatePathExistence(path, collection, fields, context.schema);
	}

	// Validate permissions for the fields
	for (const [path, { collection, fields }] of fieldMap.other.entries()) {
		validatePathPermissions(path, permissions, collection, fields);
	}

	// Validate permission for read only fields
	for (const [path, { collection, fields }] of fieldMap.read.entries()) {
		validatePathPermissions(path, readPermissions, collection, fields);
	}

	injectCases(options.ast, permissions);

	return options.ast;
}

/**
 * Shadow tables that versioned nodes read from, which require read access
 */
function getVersionedShadows(node: AST | NestedCollectionNode, shadows = new Set<string>()) {
	if (node.type === 'a2o') {
		for (const collection of node.names) {
			node.versioning?.[collection]?.shadows.forEach((shadow) => shadows.add(shadow));
			addChildShadows(node.children[collection]!, shadows);
		}

		return shadows;
	}

	node.versioning?.shadows.forEach((shadow) => shadows.add(shadow));
	addChildShadows(node.children, shadows);

	return shadows;
}

function addChildShadows(children: AST['children'], shadows: Set<string>) {
	for (const child of children) {
		if (child.type !== 'field' && child.type !== 'functionField') getVersionedShadows(child, shadows);
	}
}
