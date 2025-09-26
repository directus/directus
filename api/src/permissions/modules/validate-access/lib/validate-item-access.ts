import type { Accountability, PermissionsAction, PrimaryKey } from '@directus/types';
import { toBoolean } from '@directus/utils';
import { fetchPermittedAstRootFields } from '../../../../database/run-ast/modules/fetch-permitted-ast-root-fields.js';
import type { AST } from '../../../../types/index.js';
import type { Context } from '../../../types.js';
import { processAst } from '../../process-ast/process-ast.js';

export interface ValidateItemAccessOptions {
	accountability: Accountability;
	action: PermissionsAction;
	collection: string;
	primaryKeys: PrimaryKey[];
	fields?: string[];
	returnFieldPermissions?: boolean;
}

export async function validateItemAccess(
	options: ValidateItemAccessOptions & { returnFieldPermissions: true },
	context: Context,
): Promise<{ hasAccess: boolean; authorizedFields: string[] }>;
export async function validateItemAccess(options: ValidateItemAccessOptions, context: Context): Promise<boolean>;
export async function validateItemAccess(options: ValidateItemAccessOptions, context: Context) {
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

	const processResult = await processAst({ ast, ...options }, context);

	// Inject the filter after the permissions have been processed, as to not require access to the primary key
	processResult.ast.query.filter = {
		[primaryKeyField]: {
			_in: options.primaryKeys,
		},
	};

	const items = await fetchPermittedAstRootFields(processResult.ast, {
		schema: context.schema,
		accountability: options.accountability,
		knex: context.knex,
		action: options.action,
	});

	let hasAccess = false;

	if (items && items.length === options.primaryKeys.length) {
		hasAccess = options.fields
			? items.every((item: any) => options.fields!.every((field) => toBoolean(item[field])))
			: true;
	}

	if (options.returnFieldPermissions) {
		return {
			hasAccess,
			authorizedFields: processResult.permissions.find((p: any) => p.collection === options.collection)?.fields ?? [],
		};
	}

	return hasAccess;
}
