import { AST, NestedCollectionAST } from '../types/ast';
import { uniq } from 'lodash';
import database, { schemaInspector } from './index';
import { Filter, Query } from '../types';
import { QueryBuilder } from 'knex';

export default async function runAST(ast: AST, query = ast.query) {
	const toplevelFields: string[] = [];
	const nestedCollections: NestedCollectionAST[] = [];

	for (const child of ast.children) {
		if (child.type === 'field') {
			toplevelFields.push(child.name);
			continue;
		}

		if (!child.relation) continue;
		const m2o = isM2O(child);

		if (m2o) {
			toplevelFields.push(child.relation.field_many);
		}

		nestedCollections.push(child);
	}

	let dbQuery = database.select(toplevelFields).from(ast.name);

	if (query.filter) {
		applyFilter(dbQuery, query.filter);
	}

	if (query.sort) {
		dbQuery.orderBy(query.sort);
	}

	if (query.limit && !query.offset) {
		dbQuery.limit(query.limit);
	}

	if (query.offset) {
		dbQuery.offset(query.offset);
	}

	if (query.page) {
		dbQuery.offset(query.limit * (query.page - 1));
	}

	if (query.single) {
		dbQuery.limit(1).first();
	}

	if (query.search && ast.type === 'collection') {
		const columns = await schemaInspector.columnInfo(ast.name);

		columns
			/** @todo Check if this scales between SQL vendors */
			.filter(
				(column) =>
					column.type.toLowerCase().includes('text') ||
					column.type.toLowerCase().includes('char')
			)
			.forEach((column) => {
				dbQuery.orWhereRaw(
					`LOWER(${column.name}) LIKE '%' || LOWER(?) || '%'`,
					query.search
				);
			});
	}

	let results = await dbQuery;

	for (const batch of nestedCollections) {
		const m2o = isM2O(batch);

		let batchQuery: Query = {};

		if (m2o) {
			batchQuery = {
				...batch.query,
				filter: {
					...(batch.query.filter || {}),
					[batch.relation.primary_one]: {
						_in: uniq(results.map((res) => res[batch.relation.field_many])).filter(
							(id) => id
						),
					},
				},
			};
		} else {
			batchQuery = {
				...batch.query,
				filter: {
					...(batch.query.filter || {}),
					[batch.relation.field_many]: {
						_in: uniq(results.map((res) => res[batch.parentKey])).filter((id) => id),
					},
				},
			};
		}

		const nestedResults = await runAST(batch, batchQuery);

		results = results.map((record) => {
			if (m2o) {
				return {
					...record,
					[batch.fieldKey]:
						nestedResults.find((nestedRecord) => {
							return (
								nestedRecord[batch.relation.primary_one] === record[batch.fieldKey]
							);
						}) || null,
				};
			}

			return {
				...record,
				[batch.fieldKey]: nestedResults.filter((nestedRecord) => {
					/**
					 * @todo
					 * pull the name ID from somewhere real
					 */
					return (
						nestedRecord[batch.relation.field_many] === record.id ||
						nestedRecord[batch.relation.field_many]?.id === record.id
					);
				}),
			};
		});
	}

	return results;
}

function isM2O(child: NestedCollectionAST) {
	return (
		child.relation.collection_one === child.name && child.relation.field_many === child.fieldKey
	);
}

function applyFilter(dbQuery: QueryBuilder, filter: Filter) {
	for (const [key, value] of Object.entries(filter)) {
		if (key.startsWith('_') === false) {
			let operator = Object.keys(value)[0];
			operator = operator.slice(1);
			operator = operator.toLowerCase();

			const compareValue = Object.values(value)[0];

			if (operator === 'eq') {
				dbQuery.where({ [key]: compareValue });
			}

			if (operator === 'neq') {
				dbQuery.whereNot({ [key]: compareValue });
			}

			if (operator === 'in') {
				let value = compareValue;
				if (typeof value === 'string') value = value.split(',');

				dbQuery.whereIn(key, value as string[]);
			}

			if (operator === 'null') {
				dbQuery.whereNull(key);
			}

			if (operator === 'nnull') {
				dbQuery.whereNotNull(key);
			}
		}

		if (key === '_or') {
			value.forEach((subFilter: Record<string, any>) => {
				dbQuery.orWhere((subQuery) => applyFilter(subQuery, subFilter));
			});
		}

		if (key === '_and') {
			value.forEach((subFilter: Record<string, any>) => {
				dbQuery.andWhere((subQuery) => applyFilter(subQuery, subFilter));
			});
		}
	}
}
