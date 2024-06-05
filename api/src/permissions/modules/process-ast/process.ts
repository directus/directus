import type { PermissionsAction } from '@directus/system-data';
import type { Accountability } from '@directus/types';
import type { AST } from '../../../types/ast.js';
import { fetchPermissions } from '../../lib/fetch-permissions.js';
import { fetchPolicies } from '../../lib/fetch-policies.js';
import type { Context } from '../../types.js';
import { fieldMapFromAst } from './lib/field-map-from-ast.js';
import { injectCases } from './lib/inject-cases.js';
import type { FieldMap } from './types.js';
import { collectionsInFieldMap } from './utils/collections-in-field-map.js';
import { validatePath } from './utils/validate-path.js';

export interface ProcessAstOptions {
	ast: AST;
	action: PermissionsAction;
	accountability: Accountability | null;
}

export async function processAst(options: ProcessAstOptions, context: Context) {
	if (!options.accountability || options.accountability.admin) {
		// TODO this should still go through validatePath to check for non-existing
		// collections/fields
		return options.ast;
	}

	// FieldMap is a Map of paths in the AST, with each path containing the collection and fields in
	// that collection that the AST path tries to access
	const fieldMap: FieldMap = fieldMapFromAst(options.ast, context.schema);
	const collections = collectionsInFieldMap(fieldMap);

	const policies = await fetchPolicies(options.accountability, context);

	const permissions = await fetchPermissions(
		{ action: options.action, policies, collections, accountability: options.accountability },
		context,
	);

	for (const [path, { collection, fields }] of fieldMap.entries()) {
		validatePath(path, permissions, collection, fields);
	}

	injectCases(options.ast, permissions);

	return options.ast;
}
