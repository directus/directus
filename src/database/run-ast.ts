import { AST, NestedCollectionAST } from '../types/ast';
import { uniq } from 'lodash';
import database from './index';
import { Query } from '../types/query';

// const testAST: AST = {
// 	type: 'collection',
// 	name: 'articles',
// 	query: {},
// 	children: [
// 		{
// 			type: 'field',
// 			name: 'id'
// 		},
// 		{
// 			type: 'field',
// 			name: 'title',
// 		},
// 		{
// 			type: 'collection',
// 			name: 'authors',
// 			fieldKey: 'author_id',
// 			parentKey: 'id',
// 			relation: {
// 				id: 2,
// 				collection_many: 'articles',
// 				field_many: 'author_id',
// 				collection_one: 'authors',
// 				primary_one: 'id',
// 				field_one: null
// 			},
// 			query: {},
// 			children: [
// 				{
// 					type: 'field',
// 					name: 'id'
// 				},
// 				{
// 					type: 'field',
// 					name: 'name'
// 				},
// 				{
// 					type: 'collection',
// 					name: 'movies',
// 					fieldKey: 'movies',
// 					parentKey: 'id',
// 					relation: {
// 						id: 3,
// 						collection_many: 'movies',
// 						field_many: 'author_id',
// 						collection_one: 'authors',
// 						primary_one: 'id',
// 						field_one: 'movies'
// 					},
// 					query: {},
// 					children: [
// 						{
// 							type: 'field',
// 							name: 'id',
// 						},
// 						{
// 							type: 'field',
// 							name: 'title'
// 						},
// 						{
// 							type: 'collection',
// 							name: 'authors',
// 							fieldKey: 'author_id',
// 							parentKey: 'id',
// 							relation: {
// 								id: 4,
// 								collection_many: 'movies',
// 								field_many: 'author_id',
// 								collection_one: 'authors',
// 								primary_one: 'id',
// 								field_one: 'movies',
// 							},
// 							query: {},
// 							children: [
// 								{
// 									type: 'field',
// 									name: 'id',
// 								},
// 								{
// 									type: 'field',
// 									name: 'name',
// 								},
// 								{
// 									type: 'collection',
// 									name: 'movies',
// 									fieldKey: 'movies',
// 									parentKey: 'id',
// 									relation: {
// 										id: 6,
// 										collection_many: 'movies',
// 										field_many: 'author_id',
// 										collection_one: 'authors',
// 										primary_one: 'id',
// 										field_one: 'movies'
// 									},
// 									query: {
// 										sort: [
// 											{
// 												column: 'title',
// 												order: 'asc'
// 											}
// 										]
// 									},
// 									children: [
// 										{
// 											type: 'field',
// 											name: 'id'
// 										},
// 										{
// 											type: 'field',
// 											name: 'title'
// 										},
// 										{
// 											type: 'field',
// 											name: 'author_id'
// 										}
// 									]
// 								}
// 							]
// 						}
// 					]
// 				}
// 			]
// 		}
// 	]
// }

export default async function runAST(ast: AST, query = ast.query) {
	const toplevelFields: string[] = [];
	const nestedCollections: NestedCollectionAST[] = [];

	for (const child of ast.children) {
		if (child.type === 'field') {
			toplevelFields.push(child.name);
			continue;
		}

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
				dbQuery.whereIn(filter.column, filter.value as (string | number)[]);
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
						value: uniq(results.map((res) => res[batch.relation.field_many])),
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
						value: uniq(results.map((res) => res[batch.parentKey])),
					},
				],
			};
		}

		const nestedResults = await runAST(batch, batchQuery);

		results = results.map((record) => {
			if (m2o) {
				return {
					...record,
					[batch.fieldKey]: nestedResults.find((nestedRecord) => {
						return nestedRecord[batch.relation.primary_one] === record[batch.fieldKey];
					}),
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
