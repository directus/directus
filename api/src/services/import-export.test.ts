import { expect, test } from 'vitest';
import { getHeadingsForCsvExport } from './import-export.js';
import type { FieldNode, FunctionFieldNode, NestedCollectionNode } from '../types/ast.js';

test('Get the headings for CSV export from the field node tree', () => {
	/**
	 * this is an example result from parseFields
	 * It includes the following:
	 * - a field node
	 * - a m2o node with a nested m2o node
	 * - a o2m node
	 * - a o2m node which is the parsing result of a m2a relationship
	 */

	const parsedFields: (NestedCollectionNode | FieldNode | FunctionFieldNode)[] = [
		{
			type: 'field',
			name: 'id',
			fieldKey: 'id',
			whenCase: [],
		},
		{
			type: 'field',
			name: 'title',
			fieldKey: 'title',
			whenCase: [],
		},
		{
			type: 'm2o',
			name: 'authors',
			fieldKey: 'author',
			parentKey: 'id',
			relatedKey: 'id',
			relation: {
				collection: 'articles',
				field: 'author',
				related_collection: 'authors',
				schema: {
					constraint_name: 'articles_author_foreign',
					table: 'articles',
					column: 'author',
					foreign_key_schema: 'public',
					foreign_key_table: 'authors',
					foreign_key_column: 'id',
					on_update: 'NO ACTION',
					on_delete: 'SET NULL',
				},
				meta: {
					id: 1,
					many_collection: 'articles',
					many_field: 'author',
					one_collection: 'authors',
					one_field: null,
					one_collection_field: null,
					one_allowed_collections: null,
					junction_field: null,
					sort_field: null,
					one_deselect_action: 'nullify',
				},
			},
			query: {},
			children: [
				{
					type: 'field',
					name: 'id',
					fieldKey: 'id',
					whenCase: [],
				},
				{
					type: 'field',
					name: 'first_name',
					fieldKey: 'first_name',
					whenCase: [],
				},
				{
					type: 'field',
					name: 'last_name',
					fieldKey: 'last_name',
					whenCase: [],
				},
				{
					type: 'm2o',
					name: 'addresses',
					fieldKey: 'address',
					parentKey: 'id',
					relatedKey: 'id',
					relation: {
						collection: 'addresses',
						field: 'address',
						related_collection: 'authors',
						schema: {
							constraint_name: 'articles_author_foreign',
							table: 'articles',
							column: 'author',
							foreign_key_schema: 'public',
							foreign_key_table: 'authors',
							foreign_key_column: 'id',
							on_update: 'NO ACTION',
							on_delete: 'SET NULL',
						},
						meta: {
							id: 1,
							many_collection: 'articles',
							many_field: 'author',
							one_collection: 'authors',
							one_field: null,
							one_collection_field: null,
							one_allowed_collections: null,
							junction_field: null,
							sort_field: null,
							one_deselect_action: 'nullify',
						},
					},
					query: {},
					children: [
						{
							type: 'field',
							name: 'id',
							fieldKey: 'id',
							whenCase: [],
						},
						{
							type: 'field',
							name: 'street',
							fieldKey: 'street',
							whenCase: [],
						},
						{
							type: 'field',
							name: 'city',
							fieldKey: 'city',
							whenCase: [],
						},
					],
					cases: [],
					whenCase: [],
				},
			],
			cases: [],
			whenCase: [],
		},
		{
			type: 'o2m',
			name: 'headlines',
			fieldKey: 'headings',
			parentKey: 'id',
			relatedKey: 'id',
			relation: {
				collection: 'headlines',
				field: 'article',
				related_collection: 'articles',
				schema: {
					constraint_name: 'headlines_article_foreign',
					table: 'headlines',
					column: 'article',
					foreign_key_schema: 'public',
					foreign_key_table: 'articles',
					foreign_key_column: 'id',
					on_update: 'NO ACTION',
					on_delete: 'SET NULL',
				},
				meta: {
					id: 3,
					many_collection: 'headlines',
					many_field: 'article',
					one_collection: 'articles',
					one_field: 'headings',
					one_collection_field: null,
					one_allowed_collections: null,
					junction_field: null,
					sort_field: null,
					one_deselect_action: 'nullify',
				},
			},
			query: {
				sort: ['id'],
			},
			children: [
				{
					type: 'field',
					name: 'id',
					fieldKey: 'id',
					whenCase: [],
				},
				{
					type: 'field',
					name: 'title',
					fieldKey: 'title',
					whenCase: [],
				},
			],
			cases: [],
			whenCase: [],
		},
		{
			type: 'o2m',
			name: 'articles_m2a',
			fieldKey: 'some-m2a',
			parentKey: 'id',
			relatedKey: 'id',
			relation: {
				collection: 'articles_m2a',
				field: 'articles_id',
				related_collection: 'articles',
				schema: {
					constraint_name: 'articles_m2a_articles_id_foreign',
					table: 'articles_m2a',
					column: 'articles_id',
					foreign_key_schema: 'public',
					foreign_key_table: 'articles',
					foreign_key_column: 'id',
					on_update: 'NO ACTION',
					on_delete: 'SET NULL',
				},
				meta: {
					id: 5,
					many_collection: 'articles_m2a',
					many_field: 'articles_id',
					one_collection: 'articles',
					one_field: 'some-m2a',
					one_collection_field: null,
					one_allowed_collections: null,
					junction_field: 'item',
					sort_field: null,
					one_deselect_action: 'nullify',
				},
			},
			query: {
				sort: ['id'],
			},
			children: [
				{
					type: 'field',
					name: 'id',
					fieldKey: 'id',
					whenCase: [],
				},
				{
					type: 'field',
					name: 'articles_id',
					fieldKey: 'articles_id',
					whenCase: [],
				},
				{
					type: 'field',
					name: 'item',
					fieldKey: 'item',
					whenCase: [],
				},
				{
					type: 'field',
					name: 'collection',
					fieldKey: 'collection',
					whenCase: [],
				},
			],
			cases: [],
			whenCase: [],
		},
	];

	const res = getHeadingsForCsvExport(parsedFields);

	const expectedHeadlinesForCsvExport = [
		'id',
		'title',

		// headings for m2o node with another nested m2o node
		'author.id',
		'author.first_name',
		'author.last_name',
		'author.address.id',
		'author.address.street',
		'author.address.city',

		// headings for the o2m nodes
		'headings',
		'some-m2a',
	];

	expect(res).toEqual(expectedHeadlinesForCsvExport);
});
