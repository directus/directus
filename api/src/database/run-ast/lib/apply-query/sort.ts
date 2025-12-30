import { addJoin } from './add-join.js';
import type { AliasMap } from '../../../../utils/get-column-path.js';
import { getColumnPath } from '../../../../utils/get-column-path.js';
import { getRelationInfo } from '../../../../utils/get-relation-info.js';
import { getColumn } from '../../utils/get-column.js';
import type { Aggregate, Relation, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';

export type ColumnSortRecord = { order: 'asc' | 'desc'; column: string };

export function applySort(
	knex: Knex,
	schema: SchemaOverview,
	rootQuery: Knex.QueryBuilder,
	sort: string[],
	aggregate: Aggregate | null | undefined,
	collection: string,
	aliasMap: AliasMap,
	returnRecords = false,
) {
	const relations: Relation[] = schema.relations;
	let hasJoins = false;
	let hasMultiRelationalSort = false;

	const sortRecords = sort.map((sortField) => {
		const column: string[] = sortField.split('.');
		let order: 'asc' | 'desc' = 'asc';

		if (sortField.startsWith('-')) {
			order = 'desc';
		}

		if (column[0]!.startsWith('-')) {
			column[0] = column[0]!.substring(1);
		}

		// Is the column name one of the aggregate functions used in the query if there is any?
		if (Object.keys(aggregate ?? {}).includes(column[0]!)) {
			// If so, return the column name without the order prefix
			const operation = column[0]!;

			// Get the field for the aggregate function
			const field = column[1]!;

			// If the operation is countAll there is no field.
			if (operation === 'countAll') {
				return {
					order,
					column: 'countAll',
				};
			}

			// If the operation is a root count there is no field.
			if (operation === 'count' && (field === '*' || !field)) {
				return {
					order,
					column: 'count',
				};
			}

			// Return the column name with the operation and field name
			return {
				order,
				column: returnRecords ? column[0] : `${operation}->${field}`,
			};
		}

		if (column.length === 1) {
			const pathRoot = column[0]!.split(':')[0]!;
			const { relation, relationType } = getRelationInfo(relations, collection, pathRoot);

			if (!relation || ['m2o', 'a2o'].includes(relationType ?? '')) {
				return {
					order,
					column: returnRecords ? column[0] : (getColumn(knex, collection, column[0]!, false, schema) as any),
				};
			}
		}

		const { hasMultiRelational, isJoinAdded } = addJoin({
			path: column,
			collection,
			aliasMap,
			rootQuery,
			schema,
			knex,
		});

		const { columnPath } = getColumnPath({
			path: column,
			collection,
			aliasMap,
			relations,
			schema,
		});

		const [alias, field] = columnPath.split('.');

		if (!hasJoins) {
			hasJoins = isJoinAdded;
		}

		if (!hasMultiRelationalSort) {
			hasMultiRelationalSort = hasMultiRelational;
		}

		return {
			order,
			column: returnRecords ? columnPath : (getColumn(knex, alias!, field!, false, schema) as any),
		};
	});

	if (returnRecords) return { sortRecords, hasJoins, hasMultiRelationalSort };

	// Clears the order if any, eg: from MSSQL offset
	rootQuery.clear('order');

	rootQuery.orderBy(sortRecords);

	return { hasJoins, hasMultiRelationalSort };
}
