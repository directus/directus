import type { Accountability, Filter, Item, PermissionsAction, PrimaryKey, SchemaOverview } from '@directus/types';
import { toBoolean } from '@directus/utils';
import { fetchPermittedAstRootFields } from '../../../../database/run-ast/modules/fetch-permitted-ast-root-fields.js';
import type { AST } from '../../../../types/index.js';
import type { Context } from '../../../types.js';
import { processAst } from '../../process-ast/process-ast.js';
import { withCache, type ProvideFunction } from '@directus/memory';
import { useCache } from '../../../cache.js';
import { invalidateFilter } from '../../../../websocket/handlers/collab/invalidate-filter.js';

export interface ValidateItemAccessOptions {
	accountability: Accountability;
	action: PermissionsAction;
	collection: string;
	primaryKeys: PrimaryKey[];
	fields?: string[];
}

export const validateItemAccess = withCache(
	'validateItemAccess',
	_validateItemAccess,
	useCache(),
	(options) => ({
		accountability: options.accountability,
		collection: options.collection,
		primaryKeys: options.primaryKeys.join(','),
		fields: options.fields ? options.fields.join(',') : undefined,
		action: options.action,
	}),
	(invalidate, [filter, schema], [{ collection }]) => {
		invalidateFilter(filter, collection, schema, invalidate);
	},
);

export async function _validateItemAccess(
	options: ValidateItemAccessOptions,
	context: Context,
	provide: ProvideFunction<[Filter, SchemaOverview]>,
) {
	const primaryKeyField = context.schema.collections[options.collection]?.primary;

	if (!primaryKeyField) {
		throw new Error(`Cannot find primary key for collection "${options.collection}"`);
	}

	// When we're looking up access to specific items, we have to read them from the database to
	// make sure you are allowed to access them.

	const ast: AST = {
		type: 'root',
		name: options.collection,
		query: { limit: options.primaryKeys.length },
		// Act as if every field was a "normal" field
		children:
			options.fields?.map((field) => ({ type: 'field', name: field, fieldKey: field, whenCase: [], alias: false })) ??
			[],
		cases: [],
	};

	await processAst({ ast, ...options }, context);

	// Inject the filter after the permissions have been processed, as to not require access to the primary key
	ast.query.filter = {
		[primaryKeyField]: {
			_in: options.primaryKeys,
		},
	};

	provide(ast.query.filter!, context.schema);

	const items: Item[] = await fetchPermittedAstRootFields(ast, {
		schema: context.schema,
		accountability: options.accountability,
		knex: context.knex,
		action: options.action,
	});

	if (items && items.length === options.primaryKeys.length) {
		const { fields } = options;

		if (fields) {
			return items.every((item: any) => fields.every((field) => toBoolean(item[field])));
		}

		return true;
	}

	return false;
}
