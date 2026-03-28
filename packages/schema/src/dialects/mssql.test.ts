import { describe, expect, it } from 'vitest';
import { parseDefaultValue, rawColumnToColumn } from './mssql.js';

describe('MSSQL dialect', () => {
	describe('rawColumnToColumn', () => {
		const baseRawColumn = {
			table: 'test_table',
			name: 'test_column',
			data_type: 'nvarchar',
			max_length: null as number | null,
			numeric_precision: null,
			numeric_scale: null,
			is_generated: null,
			is_nullable: 'YES' as const,
			index_name: null,
			default_value: null,
			is_unique: null,
			is_primary_key: null,
			has_auto_increment: 'NO' as const,
			foreign_key_table: null,
			foreign_key_column: null,
			generation_expression: null,
		};

		describe('parseMaxLength', () => {
			it('returns null for nvarchar with max_length -1 (MAX)', () => {
				const result = rawColumnToColumn({ ...baseRawColumn, data_type: 'nvarchar', max_length: -1 });
				expect(result.max_length).toBeNull();
			});

			it('returns null for nchar with max_length -1 (MAX)', () => {
				const result = rawColumnToColumn({ ...baseRawColumn, data_type: 'nchar', max_length: -1 });
				expect(result.max_length).toBeNull();
			});

			it('returns null for ntext with max_length -1 (MAX)', () => {
				const result = rawColumnToColumn({ ...baseRawColumn, data_type: 'ntext', max_length: -1 });
				expect(result.max_length).toBeNull();
			});

			it('returns null for varchar with max_length -1 (MAX)', () => {
				const result = rawColumnToColumn({ ...baseRawColumn, data_type: 'varchar', max_length: -1 });
				expect(result.max_length).toBeNull();
			});

			it('returns null for char with max_length -1 (MAX)', () => {
				const result = rawColumnToColumn({ ...baseRawColumn, data_type: 'char', max_length: -1 });
				expect(result.max_length).toBeNull();
			});

			it('returns null for text with max_length -1 (MAX)', () => {
				const result = rawColumnToColumn({ ...baseRawColumn, data_type: 'text', max_length: -1 });
				expect(result.max_length).toBeNull();
			});

			it('halves max_length for nvarchar (byte-to-char conversion)', () => {
				const result = rawColumnToColumn({ ...baseRawColumn, data_type: 'nvarchar', max_length: 200 });
				expect(result.max_length).toBe(100);
			});

			it('halves max_length for nchar (byte-to-char conversion)', () => {
				const result = rawColumnToColumn({ ...baseRawColumn, data_type: 'nchar', max_length: 200 });
				expect(result.max_length).toBe(100);
			});

			it('does not halve max_length for varchar', () => {
				const result = rawColumnToColumn({ ...baseRawColumn, data_type: 'varchar', max_length: 100 });
				expect(result.max_length).toBe(100);
			});

			it('returns null when max_length is null', () => {
				const result = rawColumnToColumn({ ...baseRawColumn, data_type: 'nvarchar', max_length: null });
				expect(result.max_length).toBeNull();
			});
		});
	});

	describe('parseDefaultValue', () => {
		it('returns null for null input', () => {
			expect(parseDefaultValue(null)).toBeNull();
		});

		it('strips surrounding parentheses', () => {
			expect(parseDefaultValue("(('default_text'))")).toBe('default_text');
		});

		it('returns null for NULL string', () => {
			expect(parseDefaultValue('(null)')).toBeNull();
		});

		it('parses numeric defaults', () => {
			expect(parseDefaultValue('((0))')).toBe('0');
		});
	});
});
