import type { Filter, Permission, Query, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import type { AliasMap } from '../../../../utils/get-column-path.js';
import { getHelpers } from '../../../helpers/index.js';
import { applyCaseWhen } from '../../utils/apply-case-when.js';
import { getColumn } from '../../utils/get-column.js';
import { applyAggregate } from './aggregate.js';
import { applyFilter } from './filter/index.js';
import { joinFilterWithCases } from './join-filter-with-cases.js';
import { applyLimit, applyOffset } from './pagination.js';
import { applySearch } from './search.js';
import { applySort } from './sort.js';
import { applyVersion } from './version.js';

type ApplyQueryOptions = {
	aliasMap?: AliasMap;
	isInnerQuery?: boolean;
	hasMultiRelationalSort?: boolean | undefined;
	groupWhenCases?: number[][] | undefined;
	groupColumnPositions?: number[] | undefined;
};

/**
 * Apply the Query to a given Knex query builder instance
 */
export default function applyQuery(
	knex: Knex,
	collection: string,
	dbQuery: Knex.QueryBuilder,
	query: Query,
	schema: SchemaOverview,
	cases: Filter[],
	permissions: Permission[],
	options?: ApplyQueryOptions,
) {
	const aliasMap: AliasMap = options?.aliasMap ?? Object.create(null);
	let hasJoins = false;
	let hasMultiRelationalFilter = false;

	applyLimit(knex, dbQuery, query.limit);

	if (query.offset) {
		applyOffset(knex, dbQuery, query.offset);
	}

	if (query.page && query.limit && query.limit !== -1) {
		applyOffset(knex, dbQuery, query.limit * (query.page - 1));
	}

	if (query.sort && !options?.isInnerQuery && !options?.hasMultiRelationalSort) {
		const sortResult = applySort(knex, schema, dbQuery, query.sort, query.aggregate, collection, aliasMap);

		if (!hasJoins) {
			hasJoins = sortResult.hasJoins;
		}
	}

	if (query.version) {
		applyVersion(knex, schema, dbQuery, query.version, collection);
	}

	// `cases` are the permissions cases that are required for the current data set. We're
	// dynamically adding those into the filters that the user provided to enforce the permission
	// rules. You should be able to read an item if one or more of the cases matches. The actual case
	// is reused in the column selection case/when to dynamically return or nullify the field values
	// you're actually allowed to read

	const filter: Filter | null = joinFilterWithCases(query.filter, cases);

	if (filter) {
		const filterResult = applyFilter(knex, schema, dbQuery, filter, collection, aliasMap, cases, permissions);

		if (!hasJoins) {
			hasJoins = filterResult.hasJoins;
		}

		hasMultiRelationalFilter = filterResult.hasMultiRelationalFilter;
	}

	if (query.group) {
		const helpers = getHelpers(knex);
		const rawColumns = query.group.map((column) => getColumn(knex, collection, column, false, schema));
		let columns;

		if (options?.groupWhenCases) {
			if (helpers.capabilities.supportsColumnPositionInGroupBy() && options.groupColumnPositions) {
				// This can be streamlined for databases that support reusing the alias in group by expressions
				columns = query.group.map((column, index) =>
					options.groupColumnPositions![index] !== undefined ? knex.raw(options.groupColumnPositions![index]) : column,
				);
			} else {
				// Reconstruct the columns with the case/when logic
				columns = rawColumns.map((column, index) =>
					applyCaseWhen(
						{
							columnCases: options.groupWhenCases![index]!.map((caseIndex) => cases[caseIndex]!),
							column,
							aliasMap,
							cases,
							table: collection,
							permissions,
						},
						{
							knex,
							schema,
						},
					),
				);
			}

			if (query.sort && query.sort.length === 1 && query.sort[0] === query.group[0]) {
				// Special case, where the sort query is injected by the group by operation
				dbQuery.clear('order');

				let order = 'asc';

				if (query.sort[0]!.startsWith('-')) {
					order = 'desc';
				}

				// @ts-expect-error (orderBy does not accept Knex.Raw for some reason, even though it is handled correctly)
				// https://github.com/knex/knex/issues/5711
				dbQuery.orderBy([{ column: columns[0]!, order }]);
			}
		} else {
			columns = rawColumns;
		}

		dbQuery.groupBy(columns);
	}

	if (query.search) {
		applySearch(knex, schema, dbQuery, query.search, collection, aliasMap, permissions);
	}

	if (query.aggregate) {
		applyAggregate(schema, dbQuery, query.aggregate, collection, hasJoins);
	}

	return { query: dbQuery, hasJoins, hasMultiRelationalFilter };
}
