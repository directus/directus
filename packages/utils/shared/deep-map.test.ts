import { expect, test } from 'vitest';
import { deepMap } from './deep-map.js';

for (const value of [123, 'abc', null, undefined, true, false, new Date()]) {
	test(`primitive value ${value}`, () => {
		const result = deepMap(value, () => 'unreachable');

		expect(result).toEqual(value);
	});
}

test('keep deep complex objects', () => {
	const now = new Date();
	const result = deepMap({ key: now }, (val) => val);
	expect(result).toEqual({ key: now });
});

test('array mapping to string', () => {
	const result = deepMap([123, 'abc', true, [123, 'abc', true]], (val) => String(val));
	expect(result).toEqual(['123', 'abc', 'true', ['123', 'abc', 'true']]);
});

test('object mapping to string', () => {
	const result = deepMap({ a: 'abc', b: 123, c: true, d: { 1: 'abc', 2: 123, 3: true } }, (val) => String(val));
	expect(result).toEqual({ a: 'abc', b: '123', c: 'true', d: { 1: 'abc', 2: '123', 3: 'true' } });
});

test('turning key into value', () => {
	const result = deepMap({ a: 1, b: [undefined, true, 'whatever'], c: { d: 'deep' } }, (_, key) => key);
	expect(result).toEqual({ a: 'a', b: [0, 1, 2], c: { d: 'd' } });
});

test("don't mutate original object", () => {
	const instance = { a: 123 };
	const result = deepMap(instance, (value) => value + 1);
	expect(result === instance).toBeFalsy();
	expect(result).toEqual({ a: 124 });
});

test("don't mutate original array", () => {
	const instance = [123];
	const result = deepMap(instance, (value) => value + 1);
	expect(result === instance).toBeFalsy();
	expect(result).toEqual([124]);
});
