import { describe, expect, it } from 'vitest';
import { parseDefaultValue, rawColumnToColumn } from './mysql.js';

describe('MySQL dialect', () => {
	describe('rawColumnToColumn', () => {
		const baseRawColumn = {
			TABLE_NAME: 'test_table',
			COLUMN_NAME: 'test_column',
			COLUMN_DEFAULT: null,
			COLUMN_TYPE: 'varchar(255)',
			CHARACTER_MAXIMUM_LENGTH: 255,
			NUMERIC_PRECISION: null,
			NUMERIC_SCALE: null,
			IS_NULLABLE: 'YES' as const,
			COLLATION_NAME: null,
			COLUMN_COMMENT: null,
			REFERENCED_TABLE_NAME: null,
			REFERENCED_COLUMN_NAME: null,
			UPDATE_RULE: null,
			DELETE_RULE: null,
			COLUMN_KEY: null,
			EXTRA: null,
			CONSTRAINT_NAME: null,
			GENERATION_EXPRESSION: '',
			INDEX_NAME: null,
		};

		describe('is_generated', () => {
			it('is false when EXTRA is null', () => {
				const result = rawColumnToColumn({ ...baseRawColumn, EXTRA: null });
				expect(result.is_generated).toBe(false);
			});

			it('is false when EXTRA is auto_increment', () => {
				const result = rawColumnToColumn({ ...baseRawColumn, EXTRA: 'auto_increment' });
				expect(result.is_generated).toBe(false);
			});

			it('is true when EXTRA is VIRTUAL GENERATED', () => {
				const result = rawColumnToColumn({ ...baseRawColumn, EXTRA: 'VIRTUAL GENERATED' });
				expect(result.is_generated).toBe(true);
			});

			it('is true when EXTRA is STORED GENERATED', () => {
				const result = rawColumnToColumn({ ...baseRawColumn, EXTRA: 'STORED GENERATED' });
				expect(result.is_generated).toBe(true);
			});

			it('is false when EXTRA is DEFAULT_GENERATED (JSON field with default value in MySQL 8)', () => {
				// MySQL 8 sets EXTRA = 'DEFAULT_GENERATED' for columns with a default expression (e.g. JSON fields).
				// Such columns are NOT computed/generated — they have a stored default but are fully editable.
				// Treating them as is_generated = true incorrectly makes them read-only in the Directus UI.
				const result = rawColumnToColumn({ ...baseRawColumn, EXTRA: 'DEFAULT_GENERATED' });
				expect(result.is_generated).toBe(false);
			});
		});
	});

	describe('parseDefaultValue', () => {
		it('returns null for null input', () => {
			expect(parseDefaultValue(null)).toBeNull();
		});

		it('returns null for "null" string', () => {
			expect(parseDefaultValue('null')).toBeNull();
			expect(parseDefaultValue('NULL')).toBeNull();
		});

		it('returns stripped value for quoted string', () => {
			expect(parseDefaultValue("'hello'")).toBe('hello');
		});

		it('returns value as-is for unquoted string', () => {
			expect(parseDefaultValue('0')).toBe('0');
		});
	});
});
