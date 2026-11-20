import { describe, expect, test } from 'vitest';
import { rawColumnToColumn } from './oracledb.js';

const baseRawColumn: Parameters<typeof rawColumnToColumn>[0] = {
	TABLE_NAME: 'test_table',
	COLUMN_NAME: 'test_column',
	DATA_DEFAULT: null,
	DATA_TYPE: 'VARCHAR2',
	DATA_LENGTH: null,
	DATA_PRECISION: null,
	DATA_SCALE: null,
	CHAR_LENGTH: null,
	CHAR_USED: null,
	NULLABLE: 'Y',
	COLUMN_COMMENT: null,
	REFERENCED_TABLE_NAME: null,
	REFERENCED_COLUMN_NAME: null,
	CONSTRAINT_TYPE: null,
	VIRTUAL_COLUMN: 'NO',
	IDENTITY_COLUMN: 'NO',
	INDEX_NAME: null,
};

function fullType(overrides: Partial<typeof baseRawColumn>) {
	return rawColumnToColumn({ ...baseRawColumn, ...overrides }).full_data_type;
}

describe('full_data_type', () => {
	test('keeps the length semantics of character types', () => {
		expect(fullType({ DATA_TYPE: 'VARCHAR2', DATA_LENGTH: 40, CHAR_LENGTH: 10, CHAR_USED: 'C' })).toBe(
			'VARCHAR2(10 CHAR)',
		);

		expect(fullType({ DATA_TYPE: 'CHAR', DATA_LENGTH: 36, CHAR_LENGTH: 36, CHAR_USED: 'B' })).toBe('CHAR(36 BYTE)');
	});

	test('uses the character length of n-types', () => {
		expect(fullType({ DATA_TYPE: 'NVARCHAR2', DATA_LENGTH: 200, CHAR_LENGTH: 100, CHAR_USED: 'C' })).toBe(
			'NVARCHAR2(100)',
		);
	});

	test('adds the length of raw columns', () => {
		expect(fullType({ DATA_TYPE: 'RAW', DATA_LENGTH: 16 })).toBe('RAW(16)');
	});

	test('adds the precision and scale of numbers', () => {
		expect(fullType({ DATA_TYPE: 'NUMBER' })).toBe('NUMBER');
		expect(fullType({ DATA_TYPE: 'NUMBER', DATA_PRECISION: 10, DATA_SCALE: 2 })).toBe('NUMBER(10,2)');
		expect(fullType({ DATA_TYPE: 'NUMBER', DATA_SCALE: 0 })).toBe('NUMBER(*,0)');
	});

	test('adds the binary precision of floats', () => {
		expect(fullType({ DATA_TYPE: 'FLOAT', DATA_PRECISION: 126 })).toBe('FLOAT(126)');
	});

	test('keeps types that already hold their precision as is', () => {
		expect(fullType({ DATA_TYPE: 'TIMESTAMP(6) WITH TIME ZONE' })).toBe('TIMESTAMP(6) WITH TIME ZONE');
		expect(fullType({ DATA_TYPE: 'CLOB' })).toBe('CLOB');
	});
});
