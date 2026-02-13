import { REGEX_BETWEEN_PARENS } from '@directus/constants';
import { InvalidQueryError } from '@directus/errors';
import type { FieldFunction, Filter, Permission, Query, SchemaOverview } from '@directus/types';
import { getFunctionsForType } from '@directus/utils';
import type { Knex } from 'knex';
import type { RelationalJsonContext } from '../../../types/ast.js';
import { getFunctions } from '../../helpers/index.js';
import { applyFunctionToColumnName } from './apply-function-to-column-name.js';

type FunctionColumnOptions = {
	query: Query;
	cases: Filter[];
	permissions: Permission[];
	/** Context for relational JSON access, passed from FunctionFieldNode */
	relationalJsonContext?: RelationalJsonContext;
};

type OriginalCollectionName = {
	originalCollectionName?: string | undefined;
};

type GetColumnOptions = OriginalCollectionName | (FunctionColumnOptions & OriginalCollectionName);

/**
 * Return column prefixed by table. If column includes functions (like `year(date_created)`), the
 * column is replaced with the appropriate SQL
 *
 * @param knex Current knex / transaction instance
 * @param table Collection or alias in which column resides
 * @param column name of the column
 * @param alias Whether or not to add a SQL AS statement
 * @param schema For retrieval of the column type
 * @param options Optional parameters
 * @returns Knex raw instance
 */
export function getColumn(
	knex: Knex,
	table: string,
	column: string,
	alias: string | false = applyFunctionToColumnName(column),
	schema: SchemaOverview,
	options?: GetColumnOptions,
): Knex.Raw {
	const fn = getFunctions(knex, schema);

	if (column.includes('(') && column.includes(')')) {
		const functionName = column.split('(')[0] as FieldFunction;
		const columnName = column.match(REGEX_BETWEEN_PARENS)![1];

		if (functionName in fn) {
			const collectionName = options?.originalCollectionName || table;

			// For json function, extract the base field name from the arguments
			// json(metadata, color) -> metadata
			const baseFieldName = functionName === 'json' ? columnName!.split(',')[0]!.trim().split('.')[0]! : columnName!;

			const type = schema?.collections[collectionName]?.fields?.[baseFieldName]?.type ?? 'unknown';
			const allowedFunctions = getFunctionsForType(type);

			// For relational JSON, skip the function type check since validation happens in parse-fields
			const isRelationalJson =
				functionName === 'json' && isFunctionColumnOptions(options) && options.relationalJsonContext;

			if (!isRelationalJson && allowedFunctions.includes(functionName) === false) {
				throw new InvalidQueryError({ reason: `Invalid function specified "${functionName}"` });
			}

			// For json function, pass the full function call to preserve the path
			// For other functions, pass just the column name
			const functionArg = functionName === 'json' ? column : columnName!;

			const relationalJsonContext =
				isFunctionColumnOptions(options) && options.relationalJsonContext
					? { relationalJsonContext: options.relationalJsonContext }
					: {};

			const result = fn[functionName as keyof typeof fn](table, functionArg, {
				type,
				relationalCountOptions: isFunctionColumnOptions(options)
					? {
							query: options.query,
							cases: options.cases,
							permissions: options.permissions,
						}
					: undefined,
				originalCollectionName: options?.originalCollectionName,
				...relationalJsonContext,
			}) as Knex.Raw;

			if (alias) {
				return knex.raw(result + ' AS ??', [alias]);
			}

			return result;
		} else {
			throw new InvalidQueryError({ reason: `Invalid function specified "${functionName}"` });
		}
	}

	if (alias && column !== alias) {
		return knex.ref(`${table}.${column}`).as(alias);
	}

	return knex.ref(`${table}.${column}`);
}

function isFunctionColumnOptions(options?: GetColumnOptions): options is FunctionColumnOptions {
	return !!options && 'query' in options;
}
