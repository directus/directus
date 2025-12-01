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

	let childrenFields: string[] = [];

	if (options.returnAllowedRootFields) {
		if (options.fields && options.fields.length > 0) {
			childrenFields = options.fields;
		}
		// Otherwise, test ALL fields from the collection
		else {
			childrenFields = Object.keys(context.schema.collections[options.collection]!.fields);
		}
	} else if (options.fields) {
		// Classic behavior: test only provided fields
		childrenFields = options.fields;
	}

	const ast: AST = {
		type: 'root',
		name: options.collection,
		query: { limit: options.primaryKeys.length },
		// Act as if every field was a "normal" field
		children: childrenFields.map((field) => ({
			type: 'field',
			name: field,
			fieldKey: field,
			whenCase: [],
			alias: false,
		})),
		cases: [],
	};

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
		action: options.action,
	});

	const hasAccess = items && items.length === options.primaryKeys.length;

	if (hasAccess) {
		const { fields } = options;

		if (fields) {
			const fieldAccessValid = items.every((item: any) => fields.every((field) => toBoolean(item[field])));

			if (!fieldAccessValid) {
				return { accessAllowed: false };
			}
		}

		if (options.returnAllowedRootFields && items.length > 0) {
			const allowedRootFields = Object.keys(items[0]).filter((field) => {
				return items[0][field] === 1;
			});

			return { accessAllowed: true, allowedRootFields };
		}

		return { accessAllowed: true };
	}

	return { accessAllowed: false };
}
