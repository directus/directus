import type { Accountability, PermissionsAction, PrimaryKey, Query, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { getAstFromQuery } from '../../../../database/get-ast-from-query/get-ast-from-query.js';
import { runAst } from '../../../../database/run/run.js';
import type { AccessService } from '../../../../services/access.js';
import type { PermissionsService } from '../../../../services/index.js';
import { processAst } from '../../process-ast/process.js';

export async function validateItemAccess(
	knex: Knex,
	accessService: AccessService,
	permissionsService: PermissionsService,
	schema: SchemaOverview,
	accountability: Accountability,
	action: PermissionsAction,
	collection: string,
	primaryKeys: PrimaryKey[],
) {
	const primaryKeyField = schema.collections[collection]?.primary;

	if (!primaryKeyField) {
		throw new Error(`Cannot find primary key for collection "${collection}"`);
	}

	// When we're looking up access to specific items, we have to read them from the database to
	// make sure you are allowed to access them.

	const query: Query = {
		// We don't actually need any of the field data, just want to know if we can read the item as
		// whole or not
		fields: [],
		limit: primaryKeys.length,
		filter: {
			[primaryKeyField]: {
				_in: primaryKeys,
			},
		},
	};

	const ast = await getAstFromQuery(accessService, permissionsService, collection, query, schema, accountability);
	await processAst(accessService, permissionsService, ast, action, accountability, schema);
	const items = await runAst(ast, schema, { knex });

	if (items && items.length === primaryKeys.length) {
		return true;
	}

	return false;
}
