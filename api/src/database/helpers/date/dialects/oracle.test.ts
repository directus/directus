import { format } from 'date-fns';
import knex from 'knex';
import { MockClient } from 'knex-mock-client';
import { describe, expect, test } from 'vitest';
import { DateHelperOracle } from './oracle.js';

const helper = new DateHelperOracle(knex({ client: MockClient }));

describe('fieldFlagForField', () => {
	test('flags time fields so the schema round-trip keeps their type', () => {
		expect(helper.fieldFlagForField('time')).toBe('cast-time');
		expect(helper.fieldFlagForField('dateTime')).toBe('cast-datetime');
		expect(helper.fieldFlagForField('timestamp')).toBe('');
	});
});

describe('writeTime', () => {
	test('stores a time on the fixed epoch date in local time', () => {
		const value = helper.writeTime('10:15:30');

		expect(value).toBeInstanceOf(Date);
		expect(format(value, 'yyyy-MM-dd HH:mm:ss')).toBe('1970-01-01 10:15:30');
	});

	test('accepts fractional seconds and rejects anything that is not a time', () => {
		expect(format(helper.writeTime('10:15:30.5'), 'HH:mm:ss.SSS')).toBe('10:15:30.500');
		expect(Number.isNaN(helper.writeTime('not-a-time').getTime())).toBe(true);
		expect(Number.isNaN(helper.writeTime('10:15:30+02:00').getTime())).toBe(true);
	});
});

describe('parse', () => {
	test('turns a time filter value into the wall clock it was stored with', () => {
		expect(helper.parse('10:15:30')).toBe(format(new Date('1970-01-01T10:15:30'), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"));
	});

	test('leaves dates alone and normalizes date-times to ISO', () => {
		expect(helper.parse('2022-01-05')).toBe('2022-01-05');
		expect(helper.parse('2022-01-05T10:15:30Z')).toBe('2022-01-05T10:15:30.000Z');
		expect(helper.parse(new Date('2022-01-05T10:15:30Z'))).toBe('2022-01-05T10:15:30.000Z');
	});
});
