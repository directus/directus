import { getOperation } from './get-operation.js';
import { expect, test } from 'vitest';

test('key object without operator', () => {
	const result = getOperation('key', {
		key: 'Hi',
	});

	expect(result).toEqual({
		operator: '_eq',
		value: 'Hi',
	});
});

test('key object with _neq operator', () => {
	const result = getOperation('key', {
		_neq: 'Hi',
	});

	expect(result).toEqual({
		operator: '_neq',
		value: 'Hi',
	});
});

test('key object with nested _in operator', () => {
	const result = getOperation('key', {
		nested: {
			_in: [1, 2, 3],
		},
	});

	expect(result).toEqual({
		operator: '_in',
		value: [1, 2, 3],
	});
});

test('key as _eq object with nested _in operator', () => {
	const result = getOperation('_eq', 123);

	expect(result).toEqual({
		operator: '_eq',
		value: 123,
	});
});

for (const key of ['_some', '_none']) {
	test(`skipping of ${key}`, () => {
		const result = getOperation(key, {
			field: 1,
		});

		expect(result).toEqual({
			operator: '_eq',
			value: 1,
		});
	});
}

for (const key of ['_and', '_or']) {
	test(`key as invalid ${key}`, () => {
		const result = getOperation(key, {});

		expect(result).toBeNull();
	});
}

test('empty object', () => {
	const result = getOperation('key', {});

	expect(result).toBeNull();
});

test('nested empty object', () => {
	const result = getOperation('_or', {
		nested: {},
	});

	expect(result).toBeNull();
});
