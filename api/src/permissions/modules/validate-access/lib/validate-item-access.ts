import type { Accountability, PermissionsAction, PrimaryKey } from '@directus/types';
import { toBoolean } from '@directus/utils';
import { fetchPermittedAstRootFields } from '../../../../database/run-ast/modules/fetch-permitted-ast-root-fields.js';
import type { AST } from '../../../../types/index.js';
import type { Context } from '../../../types.js';
import { processAst } from '../../process-ast/process-ast.js';
import { fetchPolicies } from '../../../lib/fetch-policies.js';
import { fetchPermissions } from '../../../lib/fetch-permissions.js';
import { injectCases } from '../../process-ast/lib/inject-cases.js';

export interface ValidateItemAccessOptions {
	accountability: Accountability;
	action: PermissionsAction;
	collection: string;
	primaryKeys: PrimaryKey[];
	fields?: string[];
	returnAllowedRootFields?: boolean;
}

export interface ValidateItemAccessResult {
	accessAllowed: boolean;
	allowedRootFields?: string[];
}

export async function validateItemAccess(
	options: ValidateItemAccessOptions,
	context: Context,
): Promise<ValidateItemAccessResult> {
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

	// Inject the root fields after the permissions have been processed, as to not require access to all collection fields
	if (options.returnAllowedRootFields) {
		const policies = await fetchPolicies(options.accountability, context);

		const permissions = await fetchPermissions(
			{ action: options.action, policies, collections: [options.collection], accountability: options.accountability },
			context,
		);

		const schemaFields = Object.keys(context.schema.collections[options.collection]!.fields);
		const hasWildcard = permissions.some((p) => p.fields?.includes('*'));

		const allowedFields = hasWildcard ? new Set(schemaFields) : new Set(permissions.flatMap((p) => p.fields ?? []));

		// Create children only for fields that exist in schema and are allowed by permissions
		ast.children = Array.from(allowedFields)
			.filter((field) => context.schema.collections[options.collection]!.fields[field])
			.map((field) => ({
				type: 'field',
				name: field,
				fieldKey: field,
				whenCase: [],
				alias: false,
			}));

		injectCases(ast, permissions);
	}

	const items = await fetchPermittedAstRootFields(ast, {
		schema: context.schema,
		accountability: options.accountability,
		knex: context.knex,
		action: options.action,
	});

	const hasAccess = items && items.length === options.primaryKeys.length;

	if (!hasAccess) {
		return { accessAllowed: false };
	}

	let accessAllowed = true;

	// If specific fields were requested, verify they are all accessible
	if (options.fields) {
		accessAllowed = items.every((item: any) => options.fields!.every((field) => toBoolean(item[field])));
	}

	// If returnAllowedRootFields, return intersection of allowed fields across all items
	if (options.returnAllowedRootFields && items.length > 0) {
		const allowedRootFields = Object.keys(items[0]!).filter((field) => items.every((item: any) => item[field] === 1));

		return {
			accessAllowed,
			allowedRootFields,
		};
	}

	return { accessAllowed };
}
