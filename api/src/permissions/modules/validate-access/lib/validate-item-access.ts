import type { Accountability, PermissionsAction, PrimaryKey, Query } from '@directus/types';
import { getAstFromQuery } from '../../../../database/get-ast-from-query/get-ast-from-query.js';
import { fetchPermittedAstRootFields } from '../../../../database/run-ast/modules/fetch-permitted-ast-root-fields.js';
import type { Context } from '../../../types.js';
import { processAst } from '../../process-ast/process-ast.js';

export interface ValidateItemAccessOptions {
	accountability: Accountability;
	action: PermissionsAction;
	collection: string;
	primaryKeys: PrimaryKey[];
	fields?: string[];
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
		fields: options.fields ?? [],
		limit: options.primaryKeys.length,
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

	// Inject the filter after the permissions have been processed, as to not require access to the primary key
	ast.query.filter = {
		[primaryKeyField]: {
			_in: options.primaryKeys,
		},
	};

	const items = await fetchPermittedAstRootFields(ast, {
		schema: context.schema,
		accountability: options.accountability,
		knex: context.knex,
	});

	if (items && items.length === options.primaryKeys.length) {
		if (options.fields) {
			return items.every((item: any) => options.fields!.every((field) => item[field] === 1));
		}

		return true;
	}

	return false;
}
