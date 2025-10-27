import { describe, expect, test, vi } from 'vitest';
import { getHeadingsForCsvExport, createErrorTracker } from './import-export.js';
import type { FieldNode, FunctionFieldNode, NestedCollectionNode } from '../types/ast.js';

vi.mock('@directus/env', () => ({
	useEnv: () => ({
		MAX_IMPORT_ERRORS: 1000,
		EMAIL_TEMPLATES_PATH: './templates',
		EXTENSIONS_PATH: './extensions',
	}),
}));

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
			alias: false,
		},
		{
			type: 'field',
			name: 'title',
			fieldKey: 'title',
			whenCase: [],
			alias: false,
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
					alias: false,
				},
				{
					type: 'field',
					name: 'first_name',
					fieldKey: 'first_name',
					whenCase: [],
					alias: false,
				},
				{
					type: 'field',
					name: 'last_name',
					fieldKey: 'last_name',
					whenCase: [],
					alias: false,
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
							alias: false,
						},
						{
							type: 'field',
							name: 'street',
							fieldKey: 'street',
							whenCase: [],
							alias: false,
						},
						{
							type: 'field',
							name: 'city',
							fieldKey: 'city',
							whenCase: [],
							alias: false,
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
					alias: false,
				},
				{
					type: 'field',
					name: 'title',
					fieldKey: 'title',
					whenCase: [],
					alias: false,
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
					alias: false,
				},
				{
					type: 'field',
					name: 'articles_id',
					fieldKey: 'articles_id',
					whenCase: [],
					alias: false,
				},
				{
					type: 'field',
					name: 'item',
					fieldKey: 'item',
					whenCase: [],
					alias: false,
				},
				{
					type: 'field',
					name: 'collection',
					fieldKey: 'collection',
					whenCase: [],
					alias: false,
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

describe('createErrorTracker', () => {
	test('groups errors with same field and type', () => {
		const tracker = createErrorTracker();

		tracker.addCapturedError(
			{
				code: 'FAILED_VALIDATION',
				message: 'test',
				extensions: { field: 'email', type: 'nnull' },
			},
			1,
		);

		tracker.addCapturedError(
			{
				code: 'FAILED_VALIDATION',
				message: 'test',
				extensions: { field: 'email', type: 'nnull' },
			},
			3,
		);

		const errors: any[] = tracker.buildFinalErrors();

		expect(errors).toHaveLength(1);
		expect(errors[0].extensions.field).toBe('email');
		expect(errors[0].extensions.type).toBe('nnull');
		expect(errors[0].extensions.rows).toHaveLength(1);
		expect(errors[0].extensions.rows[0]?.type).toBe('lines');
		expect(errors[0].extensions.rows[0]?.rows).toEqual([1, 3]);
	});

	test('separates errors with different substring values', () => {
		const tracker = createErrorTracker();

		tracker.addCapturedError(
			{
				code: 'FAILED_VALIDATION',
				message: 'test',
				extensions: { field: 'email', type: 'contains', substring: 'later' },
			},
			1,
		);

		tracker.addCapturedError(
			{
				code: 'FAILED_VALIDATION',
				message: 'test',
				extensions: { field: 'email', type: 'contains', substring: 'now' },
			},
			2,
		);

		const errors: any[] = tracker.buildFinalErrors();

		expect(errors).toHaveLength(2);
		expect(errors[0].extensions.substring).toBe('later');
		expect(errors[0].extensions.rows[0].rows).toEqual([1]);
		expect(errors[1].extensions.substring).toBe('now');
		expect(errors[1].extensions.rows[0].rows).toEqual([2]);
	});

	test('separates errors with different valid values', () => {
		const tracker = createErrorTracker();
		const code = 'FAILED_VALIDATION';

		tracker.addCapturedError(
			{
				code,
				message: 'test',
				extensions: { field: 'age', type: 'eq', valid: 18 },
			},
			1,
		);

		tracker.addCapturedError(
			{
				code,
				message: 'test',
				extensions: { field: 'age', type: 'eq', valid: 21 },
			},
			2,
		);

		const errors: any[] = tracker.buildFinalErrors();

		expect(errors).toHaveLength(2);
		expect(errors[0].extensions.valid).toBe(18);
		expect(errors[1].extensions.valid).toBe(21);
	});

	test('converts consecutive rows to ranges', () => {
		const tracker = createErrorTracker();

		for (let i = 1; i <= 10; i++) {
			tracker.addCapturedError(
				{
					code: 'FAILED_VALIDATION',
					message: 'test',
					extensions: { field: 'email', type: 'nnull' },
				},
				i,
			);
		}

		const errors: any[] = tracker.buildFinalErrors();

		expect(errors).toHaveLength(1);
		expect(errors[0].extensions.rows).toHaveLength(1);
		expect(errors[0].extensions.rows[0].type).toBe('range');
		expect(errors[0].extensions.rows[0].start).toBe(1);
		expect(errors[0].extensions.rows[0].end).toBe(10);
	});

	test('stops collecting errors at MAX_IMPORT_ERRORS', () => {
		const tracker = createErrorTracker();

		for (let i = 1; i <= 1500; i++) {
			tracker.addCapturedError(
				{
					code: 'FAILED_VALIDATION',
					message: 'test',
					extensions: { field: 'email', type: 'nnull' },
				},
				i,
			);

			if (tracker.shouldStop()) break;
		}

		expect(tracker.getCount()).toBe(1000);
		expect(tracker.shouldStop()).toBe(true);
	});

	test('stops immediately on error without field', () => {
		const tracker = createErrorTracker();

		const nonFieldError = {
			code: 'INVALID_FOREIGN_KEY',
			message: 'test',
			extensions: {},
		};

		tracker.addCapturedError(
			{
				code: 'FAILED_VALIDATION',
				message: 'validation failed',
				extensions: { field: 'email', type: 'nnull' },
			},
			1,
		);

		tracker.addCapturedError(nonFieldError, 2);

		expect(tracker.shouldStop()).toBe(true);
		expect(tracker.hasGenericError()).toBe(true);

		const errors: any[] = tracker.buildFinalErrors();
		expect(errors).toHaveLength(1);
		expect(errors[0]).toBe(nonFieldError);
	});
});
