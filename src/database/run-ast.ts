import { AST, NestedCollectionAST } from '../types/ast';
import { uniq } from 'lodash';
import database, { schemaInspector } from './index';
import { Query } from '../types/query';

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

	const dbQuery = database.select(toplevelFields).from(ast.name);

	if (query.filter) {
		query.filter.forEach((filter) => {
			if (filter.operator === 'in') {
				let value = filter.value;
				if (typeof value === 'string') value = value.split(',');

				dbQuery.whereIn(filter.column, value as string[]);
			}

			if (filter.operator === 'eq') {
				dbQuery.where({ [filter.column]: filter.value });
			}

			if (filter.operator === 'neq') {
				dbQuery.whereNot({ [filter.column]: filter.value });
			}

			if (filter.operator === 'null') {
				dbQuery.whereNull(filter.column);
			}

			if (filter.operator === 'nnull') {
				dbQuery.whereNotNull(filter.column);
			}
		});
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
				filter: [
					...(batch.query.filter || []),
					{
						column: 'id',
						operator: 'in',
						// filter removes null / undefined
						value: uniq(results.map((res) => res[batch.relation.field_many])).filter(
							(id) => id
						),
					},
				],
			};
		} else {
			batchQuery = {
				...batch.query,
				filter: [
					...(batch.query.filter || []),
					{
						column: batch.relation.field_many,
						operator: 'in',
						// filter removes null / undefined
						value: uniq(results.map((res) => res[batch.parentKey])).filter((id) => id),
					},
				],
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
