import { describe, expect, test } from 'vitest';
import { mergeVersionSaves, mergeVersionsRaw } from './merge-version-saves.js';
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

describe('content versioning mergeVersionSaves', () => {
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
		],
	};

	test('No versions available', () => {
		const result = mergeVersionSaves({ status: 'draft' }, [], 'collection_a', testSchema);

		expect(result).toMatchObject({ status: 'draft' });
	});

	describe('m2o field', () => {
		test('Setting m2o value', () => {
			const result = mergeVersionSaves(
				{ id: 1, status: 'draft', m2o: null },
				[{ status: 'published' }, { m2o: 1 }],
				'collection_a',
				testSchema,
			);

			expect(result).toMatchObject({ id: 1, status: 'published', m2o: 1 });
		});

		test('Unsetting m2o value', () => {
			const result = mergeVersionSaves(
				{ id: 1, status: 'draft', m2o: { id: 1, status: 'draft' } },
				[{ status: 'published', m2o: null }],
				'collection_a',
				testSchema,
			);

			expect(result).toMatchObject({ id: 1, status: 'published', m2o: null });
		});
	});

	describe('o2m field', () => {
		test('Setting o2m values', () => {
			const result = mergeVersionSaves(
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

			expect(result).toMatchObject({ id: 2, status: 'draft', o2m: [{ m2o: '2', id: 2 }, { m2o: '2', id: 3 }, { status: 'draft' }] });
		});

		// test('', () => {});
	});

	describe('m2m field', () => {
		test('Adding related items', () => {
			const result = mergeVersionSaves(
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

		// test('', () => {});
	});

	describe('m2a field', () => {
		test('Adding related items', () => {
			const result = mergeVersionSaves(
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

		// test('', () => {});
	});

	// describe('nested relations', () => {
	// TODO
	// });
});
