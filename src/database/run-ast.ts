import { AST, NestedCollectionAST } from '../types/ast';
import { clone, uniq, pick } from 'lodash';
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
			if (columnsInCollection.includes(child.name) || child.name === '*') {
				toplevelFields.push(child.name);
			}

			continue;
		}

		if (!child.relation) continue;
		const m2o = isM2O(child);

		if (m2o) {
			toplevelFields.push(child.relation.many_field);
		}

		nestedCollections.push(child);
	}

	/** Always fetch primary key in case there's a nested relation that needs it */
	if (toplevelFields.includes(primaryKeyField) === false) {
		tempFields.push(primaryKeyField);
	}

	let dbQuery = database.select([...toplevelFields, ...tempFields]).from(ast.name);

	// Query defaults
	query.limit = query.limit || 100;
	query.sort = query.sort || [{ column: primaryKeyField, order: 'asc' }];

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
					query.search!
				);
			});
	}

	let results = await dbQuery;

	for (const batch of nestedCollections) {
		const m2o = isM2O(batch);

		let batchQuery: Query = {};
		let tempField: string;
		let tempLimit: number;

		if (m2o) {
			// Make sure we always fetch the nested items primary key field to ensure we have the key to match the item by
			const toplevelFields = batch.children
				.filter(({ type }) => type === 'field')
				.map(({ name }) => name);
			if (toplevelFields.includes(batch.relation.one_primary) === false) {
				tempField = batch.relation.one_primary;
				batch.children.push({ type: 'field', name: batch.relation.one_primary });
			}

			batchQuery = {
				...batch.query,
				filter: {
					...(batch.query.filter || {}),
					[batch.relation.one_primary]: {
						_in: uniq(results.map((res) => res[batch.relation.many_field])).filter(
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
			if (toplevelFields.includes(batch.relation.many_field) === false) {
				tempField = batch.relation.many_field;
				batch.children.push({ type: 'field', name: batch.relation.many_field });
			}

			batchQuery = {
				...batch.query,
				filter: {
					...(batch.query.filter || {}),
					[batch.relation.many_field]: {
						_in: uniq(results.map((res) => res[batch.parentKey])).filter((id) => id),
					},
				},
			};

			/**
			 * The nested queries are done with a WHERE m2o IN (pk, pk, pk) query. We have to remove
			 * LIMIT from that equation to ensure we limit `n` items _per parent record_ instead of
			 * `n` items in total. This limit will then be re-applied in the stitching process
			 * down below
			 */
			if (batchQuery.limit) {
				tempLimit = batchQuery.limit;
				delete batchQuery.limit;
			}
		}

		const nestedResults = await runAST(batch, batchQuery);

		results = results.map((record) => {
			if (m2o) {
				const nestedResult =
					clone(
						nestedResults.find((nestedRecord) => {
							return (
								nestedRecord[batch.relation.one_primary] === record[batch.fieldKey]
							);
						})
					) || null;

				if (tempField && nestedResult) {
					delete nestedResult[tempField];
				}

				return {
					...record,
					[batch.fieldKey]: nestedResult,
				};
			}

			// o2m
			let resultsForCurrentRecord = nestedResults
				.filter((nestedRecord) => {
					return (
						nestedRecord[batch.relation.many_field] ===
							record[batch.relation.one_primary] ||
						// In case of nested object:
						nestedRecord[batch.relation.many_field]?.[batch.relation.many_primary] ===
							record[batch.relation.one_primary]
					);
				})
				.map((nestedRecord) => {
					if (tempField) {
						delete nestedRecord[tempField];
					}

					return nestedRecord;
				});

			// Reapply LIMIT query on a per-record basis
			if (tempLimit) {
				resultsForCurrentRecord = resultsForCurrentRecord.slice(0, tempLimit);
			}

			const newRecord = {
				...record,
				[batch.fieldKey]: resultsForCurrentRecord,
			};

			return newRecord;
		});
	}

	const nestedCollectionKeys = nestedCollections.map(({ fieldKey }) => fieldKey);

	if (toplevelFields.includes('*')) {
		return results;
	}

	return results.map((result) =>
		pick(result, uniq([...nestedCollectionKeys, ...toplevelFields]))
	);
}

function isM2O(child: NestedCollectionAST) {
	return (
		child.relation.one_collection === child.name && child.relation.many_field === child.fieldKey
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
