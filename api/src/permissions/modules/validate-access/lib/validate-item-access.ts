import type { Accountability, PermissionsAction, PrimaryKey, Query } from '@directus/types';
import { getAstFromQuery } from '../../../../database/get-ast-from-query/get-ast-from-query.js';
import { runAst } from '../../../../database/run-ast/run-ast.js';
import type { Context } from '../../../types.js';
import { processAst } from '../../process-ast/process-ast.js';

export interface ValidateItemAccessOptions {
	accountability: Accountability;
	action: PermissionsAction;
	collection: string;
	primaryKeys: PrimaryKey[];
}

export async function validateItemAccess(options: ValidateItemAccessOptions, context: Context) {
	const primaryKeyField = context.schema.collections[options.collection]?.primary;

	if (!primaryKeyField) {
		throw new Error(`Cannot find primary key for collection "${options.collection}"`);
	}

	// When we're looking up access to specific items, we have to read them from the database to
	// make sure you are allowed to access them.

	const query: Query = {
		// We don't actually need any of the field data, just want to know if we can read the item as
		// whole or not
		fields: [],
		limit: options.primaryKeys.length,
		filter: {
			[primaryKeyField]: {
				_in: options.primaryKeys,
			},
		},
	};

	const ast = await getAstFromQuery(
		{
			accountability: options.accountability,
			query,
			collection: options.collection,
		},
		context,
	);

	await processAst({ ast, ...options }, context);

	const items = await runAst(ast, context.schema, { knex: context.knex });

	if (items && items.length === options.primaryKeys.length) {
		return true;
	}

	return false;
}
