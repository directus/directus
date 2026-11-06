import { describe, expect, test } from 'vitest';
import getLocalType from './get-local-type.js';

describe('getLocalType', () => {
	test('maps cast specials back to the field type the column was created with', () => {
		const column = { data_type: 'TIMESTAMP(6) WITH LOCAL TIME ZONE' };

		expect(getLocalType(column)).toBe('timestamp');
		expect(getLocalType(column, { special: ['cast-time'] })).toBe('time');
		expect(getLocalType(column, { special: ['cast-datetime'] })).toBe('dateTime');
		expect(getLocalType(column, { special: ['cast-timestamp'] })).toBe('timestamp');
	});
});
