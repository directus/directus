import type { Accountability, Permission, PermissionsAction, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { cloneDeep } from 'lodash-es';
import { fetchPermissions } from '../../../permissions/lib/fetch-permissions.js';
import { fetchPolicies } from '../../../permissions/lib/fetch-policies.js';
import type { AST } from '../../../types/ast.js';
import { getDBQuery } from '../lib/get-db-query.js';
import { parseCurrentLevel } from '../lib/parse-current-level.js';

type FetchPermittedAstRootFieldsOptions = {
	schema: SchemaOverview;
	accountability: Accountability;
	knex: Knex;
	action: PermissionsAction;
};

/**
 * Fetch the permitted top level fields of a given root type AST using a case/when query that is constructed the
 * same way as `runAst` but only returns flags (1/null) instead of actual field values.
 */
export async function fetchPermittedAstRootFields(
	originalAST: AST,
	{ schema, accountability, knex, action }: FetchPermittedAstRootFieldsOptions,
) {
	const ast = cloneDeep(originalAST);

	const { name: collection, children, cases, query } = ast;

	// Retrieve the database columns to select in the current AST
	const { fieldNodes } = await parseCurrentLevel(schema, collection, children, query);

	let permissions: Permission[] = [];

	if (accountability && !accountability.admin) {
		const policies = await fetchPolicies(accountability, { schema, knex });
		permissions = await fetchPermissions({ action, accountability, policies }, { schema, knex });
	}

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
