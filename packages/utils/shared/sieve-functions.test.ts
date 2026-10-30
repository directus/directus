import { expect, test } from 'vitest';
import { sieveFunctions } from './sieve-functions.js';

test('sieve primitive types', () => {
	expect(sieveFunctions(1)).toEqual(1);
	expect(sieveFunctions('ABC')).toEqual('ABC');
	expect(sieveFunctions(false)).toEqual(false);
	expect(sieveFunctions(undefined)).toEqual(undefined);
	expect(sieveFunctions(null)).toEqual(null);
});

test('sieve flat object', () => {
	expect(
		sieveFunctions({
			abc: 'abc',
			'123': 123,
			true: true,
			fn: () => 1,
		}),
	).toEqual({
		abc: 'abc',
		'123': 123,
		true: true,
		fn: undefined,
	});
});

test('sieve nested object', () => {
	expect(
		sieveFunctions({
			deep: {
				abc: 'abc',
				nestedFn: () => undefined,
			},
			fn: () => 1,
		}),
	).toEqual({
		deep: {
			abc: 'abc',
			nestedFn: undefined,
		},
		fn: undefined,
	});
});

test('sieve flat array', () => {
	expect(sieveFunctions([123, 'ABC', false, () => null])).toEqual([123, 'ABC', false, undefined]);
});

test('sieve nested array', () => {
	expect(sieveFunctions([() => null, [123, 'ABC', () => 123, false]])).toEqual([
		undefined,
		[123, 'ABC', undefined, false],
	]);
});

test('sieve date', () => {
	expect(sieveFunctions(new Date())).toEqual({});
});

test('sieve error', () => {
	const error = new Error('Test error message');
	const sieved = sieveFunctions(error);

	expect(sieved).toEqual({ name: 'Error', message: 'Test error message' });
	expect(sieved).not.toBeInstanceOf(Error);
	expect(sieved).not.toHaveProperty('stack');
});

test('sieve error with custom properties and cause', () => {
	const cause = new Error('Root cause');

	const error = Object.assign(new Error('Test error message', { cause }), {
		code: 'FAILED_VALIDATION',
		extensions: { field: 'title', fn: () => {} },
		status: 400,
	});

	expect(sieveFunctions(error)).toEqual({
		name: 'Error',
		message: 'Test error message',
		code: 'FAILED_VALIDATION',
		extensions: { field: 'title', fn: undefined },
		status: 400,
		cause: { name: 'Error', message: 'Root cause' },
	});
});

test('sieve nested error in object', () => {
	const error = new Error('Nested error');

	const obj = {
		status: 'failed',
		error: error,
		fn: () => {},
	};

	const sieved = sieveFunctions(obj) as any;

	expect(sieved).toHaveProperty('status', obj.status);
	expect(sieved.error).toEqual({ name: 'Error', message: 'Nested error' });
	expect(sieved.fn).toBe(undefined);
});

test('sieve errors in array', () => {
	expect(sieveFunctions([new Error('First'), new TypeError('Second')])).toEqual([
		{ name: 'Error', message: 'First' },
		{ name: 'TypeError', message: 'Second' },
	]);
});
