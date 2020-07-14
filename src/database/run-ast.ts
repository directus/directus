import { AST, NestedCollectionAST } from '../types/ast';
import { uniq, pick } from 'lodash';
import database, { schemaInspector } from './index';
import { Filter, Query } from '../types';
import { QueryBuilder } from 'knex';

export default async function runAST(ast: AST, query = ast.query) {
	const toplevelFields: string[] = [];
	const tempFields: string[] = [];
	const nestedCollections: NestedCollectionAST[] = [];
	const primaryKeyField = await schemaInspector.primary(ast.name);
	const columnsInCollection = (await schemaInspector.columns(ast.name)).map(
		({ column }) => column
	);

	for (const child of ast.children) {
		if (child.type === 'field') {
			if (columnsInCollection.includes(child.name)) {
				toplevelFields.push(child.name);
			}

			continue;
		}

		if (!child.relation) continue;
		const m2o = isM2O(child);

		if (m2o) {
			toplevelFields.push(child.relation.field_many);
		}

		nestedCollections.push(child);
	}

	/** Always fetch primary key in case there's a nested relation that needs it */
	if (toplevelFields.includes(primaryKeyField) === false) {
		tempFields.push(primaryKeyField);
	}

	let dbQuery = database.select([...toplevelFields, ...tempFields]).from(ast.name);

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
		let tempField: string = null;

		if (m2o) {
			// Make sure we always fetch the nested items primary key field to ensure we have the key to match the item by
			const toplevelFields = batch.children
				.filter(({ type }) => type === 'field')
				.map(({ name }) => name);
			if (toplevelFields.includes(batch.relation.primary_one) === false) {
				tempField = batch.relation.primary_one;
				batch.children.push({ type: 'field', name: batch.relation.primary_one });
			}

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
			// o2m
			// Make sure we always fetch the related m2o field to ensure we have the foreign key to
			// match the items by
			const toplevelFields = batch.children
				.filter(({ type }) => type === 'field')
				.map(({ name }) => name);
			if (toplevelFields.includes(batch.relation.field_many) === false) {
				tempField = batch.relation.field_many;
				batch.children.push({ type: 'field', name: batch.relation.field_many });
			}

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
				const nestedResult =
					nestedResults.find((nestedRecord) => {
						return nestedRecord[batch.relation.primary_one] === record[batch.fieldKey];
					}) || null;

				if (tempField && nestedResult) {
					delete nestedResult[tempField];
				}

				return {
					...record,
					[batch.fieldKey]: nestedResult,
				};
			}

			// o2m
			const newRecord = {
				...record,
				[batch.fieldKey]: nestedResults
					.filter((nestedRecord) => {
						/**
						 * @todo
						 * pull the name ID from somewhere real
						 */
						return (
							nestedRecord[batch.relation.field_many] === record.id ||
							nestedRecord[batch.relation.field_many]?.id === record.id
						);
					})
					.map((nestedRecord) => {
						if (tempField) {
							delete nestedRecord[tempField];
						}

						return nestedRecord;
					}),
			};

			return newRecord;
		});
	}

	const nestedCollectionKeys = nestedCollections.map(({ fieldKey }) => fieldKey);

	return results.map((result) =>
		pick(result, uniq([...nestedCollectionKeys, ...toplevelFields]))
	);
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

			const compareValue = Object.values(value)[0];

			if (operator === '_eq') {
				dbQuery.where({ [key]: compareValue });
			}

			if (operator === '_neq') {
				dbQuery.whereNot({ [key]: compareValue });
			}

			if (operator === '_in') {
				let value = compareValue;
				if (typeof value === 'string') value = value.split(',');

				dbQuery.whereIn(key, value as string[]);
			}

			if (operator === '_null') {
				dbQuery.whereNull(key);
			}

			if (operator === '_nnull') {
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
