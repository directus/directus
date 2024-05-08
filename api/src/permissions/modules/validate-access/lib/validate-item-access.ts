import type { Accountability, PermissionsAction, PrimaryKey, Query, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { getAstFromQuery } from '../../../../database/get-ast-from-query/get-ast-from-query.js';
import { runAst } from '../../../../database/run/run.js';
import type { AccessService } from '../../../../services/access.js';
import type { PermissionsService } from '../../../../services/index.js';
import { processAst } from '../../process-ast/process.js';

export interface ValidateItemAccessOptions {
	accountability: Accountability;
	action: PermissionsAction;
	collection: string;
	primaryKeys: PrimaryKey[];
}

export interface ValidateItemAccessContext {
	knex: Knex;
	accessService: AccessService;
	permissionsService: PermissionsService;
	schema: SchemaOverview;
}

export async function validateItemAccess(options: ValidateItemAccessOptions, context: ValidateItemAccessContext) {
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
		{
			accessService: context.accessService,
			permissionsService: context.permissionsService,
			schema: context.schema,
		},
	);

	await processAst(
		context.accessService,
		context.permissionsService,
		ast,
		options.action,
		options.accountability,
		context.schema,
	);

	const items = await runAst(ast, context.schema, { knex: context.knex });

	if (items && items.length === options.primaryKeys.length) {
		return true;
	}

	return false;
}
