import { describe, expect, test } from 'vitest';
import { deepMap } from './deep-map.js';

describe('deepMap', () => {
	const mockIterator = (val: any, _key: string | number) => {
		return `Test ${val}`;
	};

	test('keep complex objects', () => {
		const now = new Date();
		const mockObject = { key: now };
		expect(deepMap(mockObject, (val) => val)).toStrictEqual({ key: now });
	});

	test('object mapped where values are the return of the iterator', () => {
		const mockObject = { _and: [{ field: { _eq: 'field' } }] };
		expect(deepMap(mockObject, mockIterator)).toStrictEqual({ _and: [{ field: { _eq: 'Test field' } }] });
	});

	test('object param when passed neither an object or an array.', () => {
		const mockObject = 'test string';

		expect(deepMap(mockObject, mockIterator)).toBe(mockObject);
	});

	test('array of the iterators vals', () => {
		const mockObject = ['test', 'test2'];

		expect(deepMap(mockObject, mockIterator)).toStrictEqual(['Test test', 'Test test2']);
	});
});
