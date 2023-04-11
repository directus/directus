import type { ForeignKey } from '@directus/schema';
import type { RelationMeta } from '@directus/types';
import { describe, expect, test } from 'vitest';
import { stitchRelations } from './stitch-relations.js';

describe('stitchRelations', () => {
	test('Should merge schema and meta', () => {
		const metaRows: RelationMeta[] = [
			{
				id: 1,
				many_collection: 'collection_a',
				many_field: 'a_field',
				one_collection: 'collection_b',
				one_field: 'b_field',
				one_collection_field: null,
				one_allowed_collections: null,
				junction_field: null,
				sort_field: null,
				one_deselect_action: 'nullify',
			},
		];
		const schemaRows: ForeignKey[] = [
			{
				table: 'collection_a',
				column: 'a_field',
				foreign_key_table: 'collection_b',
				foreign_key_column: 'b_field',
				constraint_name: '123',
				on_update: null,
				on_delete: null,
			},
		];
		const result = stitchRelations(metaRows, schemaRows);
		expect(result.length).toBe(1);
		expect(result[0]).toStrictEqual({
			collection: 'collection_a',
			field: 'a_field',
			related_collection: 'collection_b',
			schema: {
				table: 'collection_a',
				column: 'a_field',
				foreign_key_table: 'collection_b',
				foreign_key_column: 'b_field',
				constraint_name: '123',
				on_update: null,
				on_delete: null,
			},
			meta: {
				id: 1,
				many_collection: 'collection_a',
				many_field: 'a_field',
				one_collection: 'collection_b',
				one_field: 'b_field',
				one_collection_field: null,
				one_allowed_collections: null,
				junction_field: null,
				sort_field: null,
				one_deselect_action: 'nullify',
			},
		});
	});
	test('Should not merge schema and meta based on table', () => {
		const metaRows: RelationMeta[] = [
			{
				id: 1,
				many_collection: 'collection_a',
				many_field: 'a_field',
				one_collection: 'collection_b',
				one_field: 'b_field',
				one_collection_field: null,
				one_allowed_collections: null,
				junction_field: null,
				sort_field: null,
				one_deselect_action: 'nullify',
			},
		];
		const schemaRows: ForeignKey[] = [
			{
				table: 'collection_c',
				column: 'c_field',
				foreign_key_table: 'collection_d',
				foreign_key_column: 'd_field',
				constraint_name: '987',
				on_update: null,
				on_delete: null,
			},
		];
		const result = stitchRelations(metaRows, schemaRows);
		expect(result.length).toBe(2);
		expect(result).toStrictEqual([
			{
				collection: 'collection_c',
				field: 'c_field',
				related_collection: 'collection_d',
				schema: {
					table: 'collection_c',
					column: 'c_field',
					foreign_key_table: 'collection_d',
					foreign_key_column: 'd_field',
					constraint_name: '987',
					on_update: null,
					on_delete: null,
				},
				meta: null,
			},
			{
				collection: 'collection_a',
				field: 'a_field',
				related_collection: 'collection_b',
				schema: null,
				meta: {
					id: 1,
					many_collection: 'collection_a',
					many_field: 'a_field',
					one_collection: 'collection_b',
					one_field: 'b_field',
					one_collection_field: null,
					one_allowed_collections: null,
					junction_field: null,
					sort_field: null,
					one_deselect_action: 'nullify',
				},
			},
		]);
	});
	test('Should not merge schema and meta based on field', () => {
		const metaRows: RelationMeta[] = [
			{
				id: 1,
				many_collection: 'collection_a',
				many_field: 'a_field',
				one_collection: 'collection_b',
				one_field: 'b_field',
				one_collection_field: null,
				one_allowed_collections: null,
				junction_field: null,
				sort_field: null,
				one_deselect_action: 'nullify',
			},
		];
		const schemaRows: ForeignKey[] = [
			{
				table: 'collection_a',
				column: 'another_field',
				foreign_key_table: 'collection_d',
				foreign_key_column: 'd_field',
				constraint_name: '987',
				on_update: null,
				on_delete: null,
			},
		];
		const result = stitchRelations(metaRows, schemaRows);
		expect(result.length).toBe(2);
		expect(result).toStrictEqual([
			{
				collection: 'collection_a',
				field: 'another_field',
				related_collection: 'collection_d',
				schema: {
					table: 'collection_a',
					column: 'another_field',
					foreign_key_table: 'collection_d',
					foreign_key_column: 'd_field',
					constraint_name: '987',
					on_update: null,
					on_delete: null,
				},
				meta: null,
			},
			{
				collection: 'collection_a',
				field: 'a_field',
				related_collection: 'collection_b',
				schema: null,
				meta: {
					id: 1,
					many_collection: 'collection_a',
					many_field: 'a_field',
					one_collection: 'collection_b',
					one_field: 'b_field',
					one_collection_field: null,
					one_allowed_collections: null,
					junction_field: null,
					sort_field: null,
					one_deselect_action: 'nullify',
				},
			},
		]);
	});
	test('Should not merge schema and meta based on related table', () => {
		const metaRows: RelationMeta[] = [
			{
				id: 1,
				many_collection: 'collection_a',
				many_field: 'a_field',
				one_collection: 'collection_b',
				one_field: 'b_field',
				one_collection_field: null,
				one_allowed_collections: null,
				junction_field: null,
				sort_field: null,
				one_deselect_action: 'nullify',
			},
		];
		const schemaRows: ForeignKey[] = [
			{
				table: 'collection_a',
				column: 'a_field',
				foreign_key_table: 'collection_d',
				foreign_key_column: 'd_field',
				constraint_name: '987',
				on_update: null,
				on_delete: null,
			},
		];
		const result = stitchRelations(metaRows, schemaRows);
		expect(result.length).toBe(2);
		expect(result).toStrictEqual([
			{
				collection: 'collection_a',
				field: 'a_field',
				related_collection: 'collection_d',
				schema: {
					table: 'collection_a',
					column: 'a_field',
					foreign_key_table: 'collection_d',
					foreign_key_column: 'd_field',
					constraint_name: '987',
					on_update: null,
					on_delete: null,
				},
				meta: null,
			},
			{
				collection: 'collection_a',
				field: 'a_field',
				related_collection: 'collection_b',
				schema: null,
				meta: {
					id: 1,
					many_collection: 'collection_a',
					many_field: 'a_field',
					one_collection: 'collection_b',
					one_field: 'b_field',
					one_collection_field: null,
					one_allowed_collections: null,
					junction_field: null,
					sort_field: null,
					one_deselect_action: 'nullify',
				},
			},
		]);
	});
});
