import { REGEX_BETWEEN_PARENS } from '@directus/constants';
import type { FieldFunction, Filter, Permission, Query, SchemaOverview } from '@directus/types';
import { getFunctionsForType } from '@directus/utils';
import type { Knex } from 'knex';
import { getFunctions } from '../database/helpers/index.js';
import { InvalidQueryError } from '@directus/errors';
import { applyFunctionToColumnName } from './apply-function-to-column-name.js';

type FunctionColumnOptions = {
	query: Query;
	cases: Filter[];
	permissions: Permission[];
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
			const type = schema?.collections[collectionName]?.fields?.[columnName!]?.type ?? 'unknown';
			const allowedFunctions = getFunctionsForType(type);

			if (allowedFunctions.includes(functionName) === false) {
				throw new InvalidQueryError({ reason: `Invalid function specified "${functionName}"` });
			}

			const result = fn[functionName as keyof typeof fn](table, columnName!, {
				type,
				relationalCountOptions: isFunctionColumnOptions(options)
					? {
							query: options.query,
							cases: options.cases,
							permissions: options.permissions,
					  }
					: undefined,
				originalCollectionName: options?.originalCollectionName,
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
