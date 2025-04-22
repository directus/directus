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
