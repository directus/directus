import { describe, it, expect } from 'vitest';
import { parsePrefillValues } from './parse-prefill-values';

describe('parsePrefillValues', () => {
	it('should parse simple field values', () => {
		const query = {
			'val[first_name]': 'Bob',
			'val[last_name]': 'Barker',
		};

		const result = parsePrefillValues(query);

		expect(result).toEqual({
			first_name: 'Bob',
			last_name: 'Barker',
		});
	});

	it('should handle empty query', () => {
		const query = {};
		const result = parsePrefillValues(query);
		expect(result).toEqual({});
	});

	it('should ignore non-prefill parameters', () => {
		const query = {
			'val[first_name]': 'Bob',
			bookmark: 'some-bookmark',
			sort: 'name',
		};

		const result = parsePrefillValues(query);

		expect(result).toEqual({
			first_name: 'Bob',
		});
	});

	it('should handle array values by taking the first value', () => {
		const query = {
			'val[first_name]': ['Bob', 'Robert'],
		};

		const result = parsePrefillValues(query);

		expect(result).toEqual({
			first_name: 'Bob',
		});
	});

	it('should handle special field names with underscores and numbers', () => {
		const query = {
			'val[field_name_123]': 'value',
			'val[email_address]': 'bob@example.com',
		};

		const result = parsePrefillValues(query);

		expect(result).toEqual({
			field_name_123: 'value',
			email_address: 'bob@example.com',
		});
	});

	it('should handle undefined and null values', () => {
		const query = {
			'val[test_field]': undefined,
			'val[another_field]': null,
		};

		const result = parsePrefillValues(query);

		expect(result).toEqual({
			test_field: undefined,
			another_field: null,
		});
	});

	it('should handle numeric string values', () => {
		const query = {
			'val[age]': '25',
			'val[count]': '100',
		};

		const result = parsePrefillValues(query);

		expect(result).toEqual({
			age: '25',
			count: '100',
		});
	});
});
