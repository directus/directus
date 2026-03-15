import { describe, expect, test, vi } from 'vitest';
import MySQL, { rawColumnToColumn } from './mysql.js';

describe('MySQL schema introspection', () => {
	test('detects auto increment when EXTRA contains additional flags', () => {
		const column = rawColumnToColumn({
			TABLE_NAME: 'produeb',
			COLUMN_NAME: 'id',
			COLUMN_DEFAULT: null,
			COLUMN_TYPE: 'int(11)',
			CHARACTER_MAXIMUM_LENGTH: null,
			NUMERIC_PRECISION: 10,
			NUMERIC_SCALE: 0,
			IS_NULLABLE: 'NO',
			COLLATION_NAME: null,
			COLUMN_COMMENT: null,
			REFERENCED_TABLE_NAME: null,
			REFERENCED_COLUMN_NAME: null,
			UPDATE_RULE: null,
			DELETE_RULE: null,
			COLUMN_KEY: 'PRI',
			EXTRA: 'auto_increment, INVISIBLE',
			CONSTRAINT_NAME: 'PRIMARY',
			GENERATION_EXPRESSION: '',
			INDEX_NAME: 'PRIMARY',
		});

		expect(column.has_auto_increment).toBe(true);
		expect(column.is_primary_key).toBe(true);
	});

	test('normalizes invisible auto increment columns in overview()', async () => {
		const knex = {
			raw: vi.fn().mockResolvedValue([
				[
					{
						table_name: 'produeb',
						column_name: 'id',
						default_value: null,
						is_nullable: 'NO',
						data_type: 'int(11)',
						column_key: 'PRI',
						max_length: null,
						extra: 'auto_increment, INVISIBLE',
					},
				],
			]),
			client: {
				database: () => 'ulrich',
			},
		} as any;

		const inspector = new MySQL(knex);
		const overview = await inspector.overview();

		expect(knex.raw).toHaveBeenCalledOnce();
		expect(overview.produeb?.primary).toBe('id');
		expect(overview.produeb?.columns.id?.default_value).toBe('AUTO_INCREMENT');
		expect(overview.produeb?.columns.id?.is_generated).toBe(false);
	});
});
