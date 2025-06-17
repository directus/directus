import { expect, test } from 'vitest';
import { getDeepQuery } from './get-deep-query.js';

test('empty object', () => {
	const result = getDeepQuery({});

	expect(result).toEqual({});
});

test('object with no _', () => {
	const result = getDeepQuery({
		a: 1,
		b: 'Hi',
	});

	expect(result).toEqual({});
});

test('object with some _', () => {
	const result = getDeepQuery({
		_first: 'Hi',
		_second: 2,
		ignored: true,
	});

	expect(result).toEqual({
		first: 'Hi',
		second: 2,
	});
});

test('object with deeb _', () => {
	const result = getDeepQuery({
		_first: {
			_deep: 1,
			ignored: 2,
		},
		ignored: {
			_deep: 1,
			ignored: 2,
		},
	});

	expect(result).toEqual({
		first: {
			_deep: 1,
			ignored: 2,
		},
	});
});
