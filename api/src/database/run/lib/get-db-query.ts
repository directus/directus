import { useEnv } from '@directus/env';
import type { Query, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { clone } from 'lodash-es';
import type { FieldNode, FunctionFieldNode } from '../../../types/ast.js';
import type { ColumnSortRecord } from '../../../utils/apply-query.js';
import applyQuery, { applyLimit, applySort, generateAlias } from '../../../utils/apply-query.js';
import { getCollectionFromAlias } from '../../../utils/get-collection-from-alias.js';
import type { AliasMap } from '../../../utils/get-column-path.js';
import { getColumn } from '../../../utils/get-column.js';
import { getHelpers } from '../../helpers/index.js';
import { getColumnPreprocessor } from '../utils/get-column-pre-processor.js';
import type { Filter } from '@directus/types';

export async function getDBQuery(
	schema: SchemaOverview,
	knex: Knex,
	table: string,
	fieldNodes: (FieldNode | FunctionFieldNode)[],
	query: Query,
	cases: Filter[],
): Promise<Knex.QueryBuilder> {
	const aliasMap: AliasMap = Object.create(null);
	const env = useEnv();
	const preProcess = getColumnPreprocessor(knex, schema, table, cases, aliasMap);
	const queryCopy = clone(query);
	const helpers = getHelpers(knex);

	queryCopy.limit = typeof queryCopy.limit === 'number' ? queryCopy.limit : Number(env['QUERY_LIMIT_DEFAULT']);

	// Queries with aggregates and groupBy will not have duplicate result
	if (queryCopy.aggregate || queryCopy.group) {
		const flatQuery = knex.from(table).select(fieldNodes.map(preProcess));
		return applyQuery(knex, table, flatQuery, queryCopy, schema, cases).query;
	}

	const primaryKey = schema.collections[table]!.primary;
	let dbQuery = knex.from(table);
	let sortRecords: ColumnSortRecord[] | undefined;
	const innerQuerySortRecords: { alias: string; order: 'asc' | 'desc' }[] = [];
	let hasMultiRelationalSort: boolean | undefined;

	if (queryCopy.sort) {
		const sortResult = applySort(knex, schema, dbQuery, queryCopy, table, aliasMap, true);

		if (sortResult) {
			sortRecords = sortResult.sortRecords;
			hasMultiRelationalSort = sortResult.hasMultiRelationalSort;
		}
	}

	const { hasMultiRelationalFilter } = applyQuery(knex, table, dbQuery, queryCopy, schema, cases, {
		aliasMap,
		isInnerQuery: true,
		hasMultiRelationalSort,
	});

	const needsInnerQuery = hasMultiRelationalSort || hasMultiRelationalFilter;

	if (needsInnerQuery) {
		dbQuery.select(`${table}.${primaryKey}`).distinct();
	} else {
		dbQuery.select(fieldNodes.map(preProcess));
	}

	if (sortRecords) {
		// Clears the order if any, eg: from MSSQL offset
		dbQuery.clear('order');

		if (needsInnerQuery) {
			let orderByString = '';
			const orderByFields: Knex.Raw[] = [];

			sortRecords.map((sortRecord) => {
				if (orderByString.length !== 0) {
					orderByString += ', ';
				}

				const sortAlias = `sort_${generateAlias()}`;

				if (sortRecord.column.includes('.')) {
					const [alias, field] = sortRecord.column.split('.');
					const originalCollectionName = getCollectionFromAlias(alias!, aliasMap);
					dbQuery.select(getColumn(knex, alias!, field!, sortAlias, schema, { originalCollectionName }));

					orderByString += `?? ${sortRecord.order}`;
					orderByFields.push(getColumn(knex, alias!, field!, false, schema, { originalCollectionName }));
				} else {
					dbQuery.select(getColumn(knex, table, sortRecord.column, sortAlias, schema));

					orderByString += `?? ${sortRecord.order}`;
					orderByFields.push(getColumn(knex, table, sortRecord.column, false, schema));
				}

				innerQuerySortRecords.push({ alias: sortAlias, order: sortRecord.order });
			});

			dbQuery.orderByRaw(orderByString, orderByFields);

			if (hasMultiRelationalSort) {
				dbQuery = helpers.schema.applyMultiRelationalSort(
					knex,
					dbQuery,
					table,
					primaryKey,
					orderByString,
					orderByFields,
				);
			}
		} else {
			sortRecords.map((sortRecord) => {
				if (sortRecord.column.includes('.')) {
					const [alias, field] = sortRecord.column.split('.');

					sortRecord.column = getColumn(knex, alias!, field!, false, schema, {
						originalCollectionName: getCollectionFromAlias(alias!, aliasMap),
					}) as any;
				} else {
					sortRecord.column = getColumn(knex, table, sortRecord.column, false, schema) as any;
				}
			});

			dbQuery.orderBy(sortRecords);
		}
	}

	if (!needsInnerQuery) return dbQuery;

	const wrapperQuery = knex
		.select(fieldNodes.map(preProcess))
		.from(table)
		.innerJoin(knex.raw('??', dbQuery.as('inner')), `${table}.${primaryKey}`, `inner.${primaryKey}`);

	if (sortRecords && needsInnerQuery) {
		innerQuerySortRecords.map((innerQuerySortRecord) => {
			wrapperQuery.orderBy(`inner.${innerQuerySortRecord.alias}`, innerQuerySortRecord.order);
		});

		if (hasMultiRelationalSort) {
			wrapperQuery.where('inner.directus_row_number', '=', 1);
			applyLimit(knex, wrapperQuery, queryCopy.limit);
		}
	}

	return wrapperQuery;
}
