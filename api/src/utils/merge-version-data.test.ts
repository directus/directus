import { describe, expect, test } from 'vitest';
import { mergeVersionsRecursive, mergeVersionsRaw } from './merge-version-data.js';
import type { SchemaOverview } from '@directus/types';

describe('content versioning mergeVersionsRaw', () => {
	test('No versions available', () => {
		const result = mergeVersionsRaw({ test_field: 'value' }, []);

		expect(result).toMatchObject({ test_field: 'value' });
	});

	test('Basic field versions', () => {
		const result = mergeVersionsRaw({ test_field: 'value', edited_field: 'original' }, [
			{ edited_field: 'updated' },
			{ test_field: null },
		]);

		expect(result).toMatchObject({
			test_field: null,
			edited_field: 'updated',
		});
	});

	test('Relational field versions', () => {
		const result = mergeVersionsRaw({ test_field: 'value', relation: null }, [
			{ relation: { create: [{ test: 'value ' }], update: [], delete: [] } },
		]);

		expect(result).toMatchObject({
			test_field: 'value',
			relation: {
				create: [{ test: 'value ' }],
				update: [],
				delete: [],
			},
		});
	});
});

describe('content versioning mergeVersionsRecursive', () => {
	const testSchema: SchemaOverview = {
		collections: {
			collection_a: {
				collection: 'collection_a',
				primary: 'id',
				singleton: false,
				note: null,
				sortField: null,
				accountability: 'all',
				fields: {
					id: {
						field: 'id',
						defaultValue: 'AUTO_INCREMENT',
						nullable: false,
						generated: false,
						type: 'integer',
						dbType: 'integer',
						precision: null,
						scale: null,
						special: [],
						note: null,
						alias: false,
						validation: null,
					},
					status: {
						field: 'status',
						defaultValue: 'draft',
						nullable: false,
						generated: false,
						type: 'string',
						dbType: 'character varying',
						precision: null,
						scale: null,
						special: [],
						note: null,
						alias: false,
						validation: null,
					},
					m2o: {
						field: 'm2o',
						defaultValue: null,
						nullable: true,
						generated: false,
						type: 'integer',
						dbType: 'integer',
						precision: null,
						scale: null,
						special: ['m2o'],
						note: null,
						alias: false,
						validation: null,
					},
					m2o_c: {
						field: 'm2o_c',
						defaultValue: null,
						nullable: true,
						generated: false,
						type: 'integer',
						dbType: 'integer',
						precision: null,
						scale: null,
						special: ['m2o'],
						note: null,
						alias: false,
						validation: null,
					},
					m2m: {
						field: 'm2m',
						defaultValue: null,
						nullable: true,
						generated: false,
						type: 'alias',
						dbType: null,
						precision: null,
						scale: null,
						special: ['m2m'],
						note: null,
						alias: true,
						validation: null,
					},
					m2a: {
						field: 'm2a',
						defaultValue: null,
						nullable: true,
						generated: false,
						type: 'alias',
						dbType: null,
						precision: null,
						scale: null,
						special: ['m2a'],
						note: null,
						alias: true,
						validation: null,
					},
				},
			},
			collection_b: {
				collection: 'collection_b',
				primary: 'id',
				singleton: false,
				note: null,
				sortField: null,
				accountability: 'all',
				fields: {
					id: {
						field: 'id',
						defaultValue: 'AUTO_INCREMENT',
						nullable: false,
						generated: false,
						type: 'integer',
						dbType: 'integer',
						precision: null,
						scale: null,
						special: [],
						note: null,
						alias: false,
						validation: null,
					},
					status: {
						field: 'status',
						defaultValue: 'draft',
						nullable: false,
						generated: false,
						type: 'string',
						dbType: 'character varying',
						precision: null,
						scale: null,
						special: [],
						note: null,
						alias: false,
						validation: null,
					},
					o2m: {
						field: 'o2m',
						defaultValue: null,
						nullable: true,
						generated: false,
						type: 'alias',
						dbType: null,
						precision: null,
						scale: null,
						special: ['o2m'],
						note: null,
						alias: true,
						validation: null,
					},
				},
			},
			collection_c: {
				collection: 'collection_c',
				primary: 'id',
				singleton: false,
				note: null,
				sortField: null,
				accountability: 'all',
				fields: {
					id: {
						field: 'id',
						defaultValue: 'AUTO_INCREMENT',
						nullable: false,
						generated: false,
						type: 'integer',
						dbType: 'integer',
						precision: null,
						scale: null,
						special: [],
						note: null,
						alias: false,
						validation: null,
					},
					status: {
						field: 'status',
						defaultValue: 'draft',
						nullable: false,
						generated: false,
						type: 'string',
						dbType: 'character varying',
						precision: null,
						scale: null,
						special: [],
						note: null,
						alias: false,
						validation: null,
					},
					translations: {
						field: 'translations',
						defaultValue: null,
						nullable: true,
						generated: false,
						type: 'alias',
						dbType: null,
						precision: null,
						scale: null,
						special: ['translations'],
						note: null,
						alias: true,
						validation: null,
					},
				},
			},
			collection_a_collection_c: {
				collection: 'collection_a_collection_c',
				primary: 'id',
				singleton: false,
				note: null,
				sortField: null,
				accountability: 'all',
				fields: {
					id: {
						field: 'id',
						defaultValue: 'AUTO_INCREMENT',
						nullable: false,
						generated: false,
						type: 'integer',
						dbType: 'integer',
						precision: null,
						scale: null,
						special: [],
						note: null,
						alias: false,
						validation: null,
					},
					collection_a_id: {
						field: 'collection_a_id',
						defaultValue: null,
						nullable: true,
						generated: false,
						type: 'integer',
						dbType: 'integer',
						precision: null,
						scale: null,
						special: [],
						note: null,
						alias: false,
						validation: null,
					},
					collection_c_id: {
						field: 'collection_c_id',
						defaultValue: null,
						nullable: true,
						generated: false,
						type: 'integer',
						dbType: 'integer',
						precision: null,
						scale: null,
						special: [],
						note: null,
						alias: false,
						validation: null,
					},
				},
			},
			collection_a_m2a: {
				collection: 'collection_a_m2a',
				primary: 'id',
				singleton: false,
				note: null,
				sortField: null,
				accountability: 'all',
				fields: {
					id: {
						field: 'id',
						defaultValue: 'AUTO_INCREMENT',
						nullable: false,
						generated: false,
						type: 'integer',
						dbType: 'integer',
						precision: null,
						scale: null,
						special: [],
						note: null,
						alias: false,
						validation: null,
					},
					collection_a_id: {
						field: 'collection_a_id',
						defaultValue: null,
						nullable: true,
						generated: false,
						type: 'integer',
						dbType: 'integer',
						precision: null,
						scale: null,
						special: [],
						note: null,
						alias: false,
						validation: null,
					},
					item: {
						field: 'item',
						defaultValue: null,
						nullable: true,
						generated: false,
						type: 'string',
						dbType: 'character varying',
						precision: null,
						scale: null,
						special: [],
						note: null,
						alias: false,
						validation: null,
					},
					collection: {
						field: 'collection',
						defaultValue: null,
						nullable: true,
						generated: false,
						type: 'string',
						dbType: 'character varying',
						precision: null,
						scale: null,
						special: [],
						note: null,
						alias: false,
						validation: null,
					},
				},
			},
			languages: {
				collection: 'languages',
				primary: 'code',
				singleton: false,
				note: null,
				sortField: null,
				accountability: 'all',
				fields: {
					code: {
						field: 'code',
						defaultValue: null,
						nullable: false,
						generated: false,
						type: 'string',
						dbType: 'character varying',
						precision: null,
						scale: null,
						special: [],
						note: null,
						alias: false,
						validation: null,
					},
					name: {
						field: 'name',
						defaultValue: null,
						nullable: true,
						generated: false,
						type: 'string',
						dbType: 'character varying',
						precision: null,
						scale: null,
						special: [],
						note: null,
						alias: false,
						validation: null,
					},
					direction: {
						field: 'direction',
						defaultValue: 'ltr',
						nullable: true,
						generated: false,
						type: 'string',
						dbType: 'character varying',
						precision: null,
						scale: null,
						special: [],
						note: null,
						alias: false,
						validation: null,
					},
				},
			},
			collection_c_translations: {
				collection: 'collection_c_translations',
				primary: 'id',
				singleton: false,
				note: null,
				sortField: null,
				accountability: 'all',
				fields: {
					id: {
						field: 'id',
						defaultValue: 'AUTO_INCREMENT',
						nullable: false,
						generated: false,
						type: 'integer',
						dbType: 'integer',
						precision: null,
						scale: null,
						special: [],
						note: null,
						alias: false,
						validation: null,
					},
					collection_c_id: {
						field: 'collection_c_id',
						defaultValue: null,
						nullable: true,
						generated: false,
						type: 'integer',
						dbType: 'integer',
						precision: null,
						scale: null,
						special: [],
						note: null,
						alias: false,
						validation: null,
					},
					languages_id: {
						field: 'languages_id',
						defaultValue: null,
						nullable: true,
						generated: false,
						type: 'string',
						dbType: 'character varying',
						precision: null,
						scale: null,
						special: [],
						note: null,
						alias: false,
						validation: null,
					},
					text: {
						field: 'text',
						defaultValue: null,
						nullable: true,
						generated: false,
						type: 'string',
						dbType: 'character varying',
						precision: null,
						scale: null,
						special: [],
						note: null,
						alias: false,
						validation: null,
					},
				},
			},
		},
		relations: [
			{
				collection: 'collection_a',
				field: 'm2o',
				related_collection: 'collection_b',
				schema: {
					constraint_name: 'collection_a_m2o_foreign',
					table: 'collection_a',
					column: 'm2o',
					foreign_key_schema: 'public',
					foreign_key_table: 'collection_b',
					foreign_key_column: 'id',
					on_update: 'NO ACTION',
					on_delete: 'SET NULL',
				},
				meta: {
					id: 4,
					many_collection: 'collection_a',
					many_field: 'm2o',
					one_collection: 'collection_b',
					one_field: 'o2m',
					one_collection_field: null,
					one_allowed_collections: null,
					junction_field: null,
					sort_field: null,
					one_deselect_action: 'nullify',
				},
			},
			{
				collection: 'collection_a_collection_c',
				field: 'collection_a_id',
				related_collection: 'collection_a',
				schema: {
					constraint_name: 'collection_a_collection_c_collection_a_id_foreign',
					table: 'collection_a_collection_c',
					column: 'collection_a_id',
					foreign_key_schema: 'public',
					foreign_key_table: 'collection_a',
					foreign_key_column: 'id',
					on_update: 'NO ACTION',
					on_delete: 'SET NULL',
				},
				meta: {
					id: 6,
					many_collection: 'collection_a_collection_c',
					many_field: 'collection_a_id',
					one_collection: 'collection_a',
					one_field: 'm2m',
					one_collection_field: null,
					one_allowed_collections: null,
					junction_field: 'collection_c_id',
					sort_field: null,
					one_deselect_action: 'nullify',
				},
			},
			{
				collection: 'collection_a_collection_c',
				field: 'collection_c_id',
				related_collection: 'collection_c',
				schema: {
					constraint_name: 'collection_a_collection_c_collection_c_id_foreign',
					table: 'collection_a_collection_c',
					column: 'collection_c_id',
					foreign_key_schema: 'public',
					foreign_key_table: 'collection_c',
					foreign_key_column: 'id',
					on_update: 'NO ACTION',
					on_delete: 'SET NULL',
				},
				meta: {
					id: 5,
					many_collection: 'collection_a_collection_c',
					many_field: 'collection_c_id',
					one_collection: 'collection_c',
					one_field: null,
					one_collection_field: null,
					one_allowed_collections: null,
					junction_field: 'collection_a_id',
					sort_field: null,
					one_deselect_action: 'nullify',
				},
			},
			{
				collection: 'collection_a_m2a',
				field: 'collection_a_id',
				related_collection: 'collection_a',
				schema: {
					constraint_name: 'collection_a_m2a_collection_a_id_foreign',
					table: 'collection_a_m2a',
					column: 'collection_a_id',
					foreign_key_schema: 'public',
					foreign_key_table: 'collection_a',
					foreign_key_column: 'id',
					on_update: 'NO ACTION',
					on_delete: 'SET NULL',
				},
				meta: {
					id: 8,
					many_collection: 'collection_a_m2a',
					many_field: 'collection_a_id',
					one_collection: 'collection_a',
					one_field: 'm2a',
					one_collection_field: null,
					one_allowed_collections: null,
					junction_field: 'item',
					sort_field: null,
					one_deselect_action: 'nullify',
				},
			},
			{
				collection: 'collection_c_translations',
				field: 'collection_c_id',
				related_collection: 'collection_c',
				schema: {
					constraint_name: 'collection_c_translations_collection_c_id_foreign',
					table: 'collection_c_translations',
					column: 'collection_c_id',
					foreign_key_schema: 'public',
					foreign_key_table: 'collection_c',
					foreign_key_column: 'id',
					on_update: 'NO ACTION',
					on_delete: 'SET NULL',
				},
				meta: {
					id: 10,
					many_collection: 'collection_c_translations',
					many_field: 'collection_c_id',
					one_collection: 'collection_c',
					one_field: 'translations',
					one_collection_field: null,
					one_allowed_collections: null,
					junction_field: 'languages_id',
					sort_field: null,
					one_deselect_action: 'nullify',
				},
			},
			{
				collection: 'collection_c_translations',
				field: 'languages_id',
				related_collection: 'languages',
				schema: {
					constraint_name: 'collection_c_translations_languages_id_foreign',
					table: 'collection_c_translations',
					column: 'languages_id',
					foreign_key_schema: 'public',
					foreign_key_table: 'languages',
					foreign_key_column: 'code',
					on_update: 'NO ACTION',
					on_delete: 'SET NULL',
				},
				meta: {
					id: 9,
					many_collection: 'collection_c_translations',
					many_field: 'languages_id',
					one_collection: 'languages',
					one_field: null,
					one_collection_field: null,
					one_allowed_collections: null,
					junction_field: 'collection_c_id',
					sort_field: null,
					one_deselect_action: 'nullify',
				},
			},
			{
				collection: 'collection_a_m2a',
				field: 'item',
				related_collection: null,
				schema: null,
				meta: {
					id: 7,
					many_collection: 'collection_a_m2a',
					many_field: 'item',
					one_collection: null,
					one_field: null,
					one_collection_field: 'collection',
					one_allowed_collections: ['collection_b', 'collection_c'],
					junction_field: 'collection_a_id',
					sort_field: null,
					one_deselect_action: 'nullify',
				},
			},
			{
				collection: 'collection_a',
				field: 'm2o_c',
				related_collection: 'collection_c',
				schema: {
					constraint_name: 'collection_a_m2o_c_foreign',
					table: 'collection_a',
					column: 'm2o_c',
					foreign_key_schema: 'public',
					foreign_key_table: 'collection_c',
					foreign_key_column: 'id',
					on_update: 'NO ACTION',
					on_delete: 'SET NULL',
				},
				meta: {
					id: 11,
					many_collection: 'collection_a',
					many_field: 'm2o_c',
					one_collection: 'collection_c',
					one_field: null,
					one_collection_field: null,
					one_allowed_collections: null,
					junction_field: null,
					sort_field: null,
					one_deselect_action: 'nullify',
				},
			},
		],
	};

	test('No versions available', () => {
		const result = mergeVersionsRecursive({ status: 'draft' }, [], 'collection_a', testSchema);

		expect(result).toMatchObject({ status: 'draft' });
	});

	describe('m2o field', () => {
		test('Setting m2o value', () => {
			const result = mergeVersionsRecursive(
				{ id: 1, status: 'draft', m2o: null },
				[{ status: 'published' }, { m2o: 1 }],
				'collection_a',
				testSchema,
			);

			expect(result).toMatchObject({ id: 1, status: 'published', m2o: 1 });
		});

		test('Unsetting m2o value', () => {
			const result = mergeVersionsRecursive(
				{ id: 1, status: 'draft', m2o: { id: 1, status: 'draft' } },
				[{ status: 'published', m2o: null }],
				'collection_a',
				testSchema,
			);

			expect(result).toMatchObject({ id: 1, status: 'published', m2o: null });
		});

		test('Updating m2o value', () => {
			const result = mergeVersionsRecursive(
				{ id: 1, status: 'draft', m2o: { id: 1, test: 'data', status: 'draft' } },
				[{ status: 'published' }, { m2o: { id: 1, status: 'published' } }],
				'collection_a',
				testSchema,
			);

			expect(result).toMatchObject({ id: 1, status: 'published', m2o: { id: 1, test: 'data', status: 'published' } });
		});
	});

	describe('o2m field', () => {
		test('Setting o2m values', () => {
			const result = mergeVersionsRecursive(
				{ id: 2, status: 'draft', o2m: [] },
				[
					{
						o2m: {
							create: [{ status: 'draft' }],
							update: [
								{
									m2o: '2',
									id: 2,
								},
								{
									m2o: '2',
									id: 3,
								},
							],
							delete: [],
						},
					},
				],
				'collection_b',
				testSchema,
			);

			expect(result).toMatchObject({
				id: 2,
				status: 'draft',
				o2m: [{ m2o: '2', id: 2 }, { m2o: '2', id: 3 }, { status: 'draft' }],
			});
		});

		test('Updating o2m values', () => {
			const result = mergeVersionsRecursive(
				{ id: 1, status: 'draft', o2m: [1, 2, 3, { id: 4, test: 'value' }, { id: 5 }] },
				[
					{
						status: 'published',
					},
					{
						o2m: {
							create: [
								{
									test: 'new',
								},
							],
							update: [
								{
									id: 1,
								},
								{
									id: 4,
								},
							],
							delete: [2, 5],
						},
					},
				],
				'collection_b',
				testSchema,
			);

			expect(result).toMatchObject({
				id: 1,
				status: 'published',
				o2m: [
					{
						id: 1,
					},
					3,
					{
						id: 4,
						test: 'value',
					},
					{
						test: 'new',
					},
				],
			});
		});
	});

	describe('m2m field', () => {
		test('Adding related items', () => {
			const result = mergeVersionsRecursive(
				{
					id: 1,
					status: 'draft',
					m2m: [],
				},
				[
					{
						status: 'published',
						m2m: {
							create: [
								{
									collection_c_id: {
										status: 'published',
									},
								},
								{
									collection_a_id: '1',
									collection_c_id: {
										id: 1,
									},
								},
							],
							update: [],
							delete: [],
						},
					},
				],
				'collection_a',
				testSchema,
			);

			expect(result).toMatchObject({
				id: 1,
				status: 'published',
				m2m: [
					{
						collection_c_id: {
							status: 'published',
						},
					},
					{
						collection_a_id: '1',
						collection_c_id: {
							id: 1,
						},
					},
				],
			});
		});

		test('Updating m2m values', () => {
			const result = mergeVersionsRecursive(
				{
					id: 1,
					status: 'draft',
					m2m: [1, 2, 3, { id: 4 }, { id: 5 }],
				},
				[
					{
						status: 'published',
					},
					{
						m2m: {
							create: [
								{
									collection_c_id: {
										id: 3,
									},
								},
							],
							update: [
								{
									id: 1,
									collection_c_id: {
										id: 1,
									},
								},
								{
									id: 4,
									collection_c_id: {
										id: 2,
									},
								},
							],
							delete: [2, 5],
						},
					},
				],
				'collection_a',
				testSchema,
			);

			expect(result).toMatchObject({
				id: 1,
				status: 'published',
				m2m: [
					{
						collection_c_id: {
							id: 1,
						},
						id: 1,
					},
					3,
					{
						id: 4,
						collection_c_id: {
							id: 2,
						},
					},
					{
						collection_c_id: {
							id: 3,
						},
					},
				],
			});
		});
	});

	describe('m2a field', () => {
		test('Adding related items', () => {
			const result = mergeVersionsRecursive(
				{
					id: 1,
					status: 'draft',
					m2a: [],
				},
				[
					{
						m2a: {
							create: [
								{
									collection_a_id: '1',
									collection: 'collection_b',
									item: {
										id: 2,
									},
								},
								{
									collection_a_id: '1',
									collection: 'collection_c',
									item: {
										id: 1,
									},
								},
								{
									collection: 'collection_b',
									item: {
										status: 'published',
									},
								},
								{
									collection: 'collection_c',
									item: {
										status: 'published',
									},
								},
							],
							update: [],
							delete: [],
						},
					},
				],
				'collection_a',
				testSchema,
			);

			expect(result).toMatchObject({
				id: 1,
				status: 'draft',
				m2a: [
					{
						collection_a_id: '1',
						collection: 'collection_b',
						item: {
							id: 2,
						},
					},
					{
						collection_a_id: '1',
						collection: 'collection_c',
						item: {
							id: 1,
						},
					},
					{
						collection: 'collection_b',
						item: {
							status: 'published',
						},
					},
					{
						collection: 'collection_c',
						item: {
							status: 'published',
						},
					},
				],
			});
		});

		test('Updating m2a values', () => {
			const result = mergeVersionsRecursive(
				{
					id: 1,
					status: 'draft',
					m2a: [
						1,
						{
							id: 2,
							collection_a_id: 1,
							item: '1',
							collection: 'collection_c',
						},
						3,
						{ id: 4 },
						{
							id: 5,
							collection_a_id: 1,
							item: '1',
							collection: 'collection_b',
						},
					],
				},
				[
					{
						status: 'published',
					},
					{
						m2a: {
							create: [
								{
									collection: 'collection_c',
									item: {
										status: 'published',
									},
								},
							],
							update: [
								{
									collection: 'collection_b',
									item: {
										status: 'published',
										id: 1,
									},
									id: 1,
								},
								{
									collection: 'collection_b',
									item: {
										id: '2',
									},
									id: 5,
								},
							],
							delete: [2, 4],
						},
					},
				],
				'collection_a',
				testSchema,
			);

			expect(result).toMatchObject({
				id: 1,
				status: 'published',
				m2a: [
					{
						id: 1,
						item: {
							status: 'published',
							id: 1,
						},
						collection: 'collection_b',
					},
					3,
					{
						id: 5,
						collection_a_id: 1,
						item: {
							id: '2',
						},
						collection: 'collection_b',
					},
					{
						collection: 'collection_c',
						item: {
							status: 'published',
						},
					},
				],
			});
		});
	});

	describe('nested relations', () => {
		test('m2o > translation', () => {
			const result = mergeVersionsRecursive(
				{
					id: 1,
					status: 'draft',
					m2o_c: {
						id: 1,
						status: 'draft',
						translations: [
							{
								id: 1,
								collection_c_id: 1,
								languages_id: 'ar-SA',
								text: 'ar-sa',
							},
							{
								id: 2,
								collection_c_id: 1,
								languages_id: 'de-DE',
								text: 'de-de',
							},
						],
					},
				},
				[
					{
						m2o_c: {
							translations: {
								create: [
									{
										text: 'en-us',
										languages_id: {
											code: 'en-US',
										},
										collection_c_id: 1,
									},
								],
								update: [
									{
										text: 'german',
										languages_id: {
											code: 'de-DE',
										},
										id: 2,
									},
								],
								delete: [1],
							},
							id: 1,
						},
					},
				],
				'collection_a',
				testSchema,
			);

			expect(result).toMatchObject({
				id: 1,
				status: 'draft',
				m2o_c: {
					id: 1,
					status: 'draft',
					translations: [
						{
							id: 2,
							collection_c_id: 1,
							languages_id: {
								code: 'de-DE',
							},
							text: 'german',
						},
						{
							text: 'en-us',
							languages_id: {
								code: 'en-US',
							},
							collection_c_id: 1,
						},
					],
				},
			});
		});

		test('m2m > translations', () => {
			const result = mergeVersionsRecursive(
				{
					id: 3,
					status: 'draft',
					m2m: [
						{
							id: 2,
							collection_a_id: 3,
							collection_c_id: {
								id: 1,
								status: 'draft',
								translations: [
									{
										id: 1,
										collection_c_id: 1,
										languages_id: 'ar-SA',
										text: 'ar-sa',
									},
									{
										id: 2,
										collection_c_id: 1,
										languages_id: 'de-DE',
										text: 'de-de',
									},
								],
							},
						},
						{
							id: 3,
							collection_a_id: 3,
							collection_c_id: {
								id: 2,
								status: 'draft',
								translations: [],
							},
						},
					],
				},
				[
					{
						m2m: {
							create: [],
							update: [
								{
									collection_c_id: {
										translations: {
											create: [
												{
													text: 'english',
													languages_id: {
														code: 'en-US',
													},
													collection_c_id: 1,
												},
											],
											update: [
												{
													text: 'german',
													languages_id: {
														code: 'de-DE',
													},
													id: 2,
												},
											],
											delete: [1],
										},
										id: 1,
									},
									id: 2,
								},
							],
							delete: [3],
						},
					},
				],
				'collection_a',
				testSchema,
			);

			expect(result).toMatchObject({
				id: 3,
				status: 'draft',
				m2m: [
					{
						id: 2,
						collection_a_id: 3,
						collection_c_id: {
							translations: [
								{
									id: 2,
									collection_c_id: 1,
									text: 'german',
									languages_id: {
										code: 'de-DE',
									},
								},
								{
									text: 'english',
									languages_id: {
										code: 'en-US',
									},
									collection_c_id: 1,
								},
							],
							id: 1,
						},
					},
				],
			});
		});

		test('m2a > translations', () => {
			const result = mergeVersionsRecursive(
				{
					id: 4,
					status: 'draft',
					m2a: [
						{
							id: 3,
							collection_a_id: 4,
							collection: 'collection_b',
							item: 2,
						},
						{
							id: 4,
							collection_a_id: 4,
							collection: 'collection_c',
							item: {
								id: 1,
								translations: [
									{
										id: 1,
										collection_c_id: 1,
										languages_id: 'ar-SA',
										text: 'ar-sa',
									},
									{
										id: 2,
										collection_c_id: 1,
										languages_id: 'de-DE',
										text: 'de-de',
									},
								],
							},
						},
					],
				},
				[
					{
						m2a: {
							create: [],
							update: [
								{
									collection: 'collection_c',
									item: {
										translations: {
											create: [
												{
													languages_id: {
														code: 'en-US',
													},
													collection_c_id: 1,
													text: 'english',
												},
											],
											update: [
												{
													text: 'german',
													languages_id: {
														code: 'de-DE',
													},
													id: 2,
												},
											],
											delete: [1],
										},
										id: 1,
									},
									id: 4,
								},
							],
							delete: [],
						},
					},
				],
				'collection_a',
				testSchema,
			);

			expect(result).toMatchObject({
				id: 4,
				status: 'draft',
				m2a: [
					{
						id: 3,
						collection_a_id: 4,
						collection: 'collection_b',
						item: 2,
					},
					{
						id: 4,
						collection_a_id: 4,
						collection: 'collection_c',
						item: {
							id: 1,
							translations: [
								{
									id: 2,
									collection_c_id: 1,
									languages_id: {
										code: 'de-DE',
									},
									text: 'german',
								},
								{
									languages_id: {
										code: 'en-US',
									},
									collection_c_id: 1,
									text: 'english',
								},
							],
						},
					},
				],
			});
		});

		test('creating nested relations', () => {
			const result = mergeVersionsRecursive(
				{
					id: 2,
					status: 'draft',
					m2m: [],
					m2o_c: null,
				},
				[
					{
						m2m: {
							create: [
								{
									collection_c_id: {
										translations: {
											create: [
												{
													text: 'german',
													languages_id: {
														code: 'de-DE',
													},
												},
												{
													text: 'english',
													languages_id: {
														code: 'en-US',
													},
												},
											],
											update: [],
											delete: [],
										},
									},
								},
							],
							update: [],
							delete: [],
						},
						m2o_c: {
							translations: {
								create: [
									{
										text: 'french',
										languages_id: {
											code: 'fr-FR',
										},
									},
									{
										text: 'english',
										languages_id: {
											code: 'en-US',
										},
									},
								],
								update: [],
								delete: [],
							},
						},
					},
				],
				'collection_a',
				testSchema,
			);

			expect(result).toMatchObject({
				id: 2,
				status: 'draft',
				m2m: [
					{
						collection_c_id: {
							translations: [
								{
									text: 'german',
									languages_id: {
										code: 'de-DE',
									},
								},
								{
									text: 'english',
									languages_id: {
										code: 'en-US',
									},
								},
							],
						},
					},
				],
				m2o_c: {
					translations: [
						{
							text: 'french',
							languages_id: {
								code: 'fr-FR',
							},
						},
						{
							text: 'english',
							languages_id: {
								code: 'en-US',
							},
						},
					],
				},
			});
		});
	});
});
