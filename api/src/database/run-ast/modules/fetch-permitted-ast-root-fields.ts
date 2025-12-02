import type { Accountability, Filter, Permission, PermissionsAction, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { cloneDeep } from 'lodash-es';
import { fetchPermissions } from '../../../permissions/lib/fetch-permissions.js';
import { fetchPolicies } from '../../../permissions/lib/fetch-policies.js';
import { getCases } from '../../../permissions/modules/process-ast/lib/get-cases.js';
import type { AST, FieldNode } from '../../../types/ast.js';
import { getDBQuery } from '../lib/get-db-query.js';
import { parseCurrentLevel } from '../lib/parse-current-level.js';

type FetchPermittedAstRootFieldsOptions = {
	schema: SchemaOverview;
	accountability: Accountability;
	knex: Knex;
	action: PermissionsAction;
	fieldsOverride?: string[]; // When provided, cases and whenCase will be computed internally based on fetched permissions
};

/**
 * Fetch the permitted top level fields of a given root type AST using a case/when query that is constructed the
 * same way as `runAst` but only returns flags (1/null) instead of actual field values.
 */
export async function fetchPermittedAstRootFields(
	originalAST: AST,
	{ schema, accountability, knex, action, fieldsOverride }: FetchPermittedAstRootFieldsOptions,
) {
	const ast = cloneDeep(originalAST);
	const { name: collection, query } = ast;

	let permissions: Permission[] = [];

	if (accountability && !accountability.admin) {
		const policies = await fetchPolicies(accountability, { schema, knex });
		permissions = await fetchPermissions({ action, accountability, policies }, { schema, knex });
	}

	let children = ast.children;
	let cases: Filter[] = ast.cases;

	// If fieldsOverride is provided, create children and compute cases internally
	if (fieldsOverride) {
		children = fieldsOverride.map((field): FieldNode => ({
			type: 'field',
			name: field,
			fieldKey: field,
			whenCase: [],
			alias: false,
		}));

		const { cases: newCases, caseMap, allowedFields } = getCases(collection, permissions, fieldsOverride);
		cases = newCases;

		// Inject whenCase into each child based on caseMap
		for (const child of children) {
			const fieldKey = child.fieldKey;

			const globalWhenCase = caseMap['*'] ?? [];
			const fieldWhenCase = caseMap[fieldKey] ?? [];

			// If the field is always allowed (no condition needed), skip whenCase injection
			if (allowedFields.has('*') || allowedFields.has(fieldKey)) {
				child.whenCase = [];
			} else {
				child.whenCase = [...globalWhenCase, ...fieldWhenCase];
			}
		}
	}

	// Retrieve the database columns to select in the current AST
	const { fieldNodes } = await parseCurrentLevel(schema, collection, children, query);

	return getDBQuery(
		{
			table: collection,
			fieldNodes,
			o2mNodes: [],
			query,
			cases,
			permissions,
			permissionsOnly: true,
		},
		{ schema, knex },
	);
}
