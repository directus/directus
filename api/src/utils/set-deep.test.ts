import { describe, expect, test } from 'vitest';
import { setDeep } from './set-deep.js';

// Callers build the root with `Object.create(null)`; mirror that here.
const root = (): Record<string, any> => Object.create(null);

describe('setDeep', () => {
	test('sets a nested value from an array path', () => {
		expect(setDeep(root(), ['a', 'b', 'c'], 1)).toEqual({ a: { b: { c: 1 } } });
	});

	test('sets a nested value from a dotted string path', () => {
		expect(setDeep(root(), 'a.b.c', 1)).toEqual({ a: { b: { c: 1 } } });
	});

	test('reuses existing own intermediate objects when building deeper paths', () => {
		const r = root();

		setDeep(r, ['relation', 'nested'], { _limit: 1 });
		setDeep(r, ['relation', 'other'], { _limit: 2 });

		expect(r).toEqual({ relation: { nested: { _limit: 1 }, other: { _limit: 2 } } });
	});

	test('assigns the final value as-is (merging is the caller responsibility)', () => {
		const r = setDeep(root(), ['a'], { keep: 1 });
		setDeep(r, ['a'], 'scalar');

		expect(r).toEqual({ a: 'scalar' });
	});

	describe('prototype pollution containment (GHSA-gwvv-rr68-cmv6)', () => {
		test('does not corrupt Object.prototype.toString.call', () => {
			const original = Object.prototype.toString.call;

			const r = setDeep(root(), ['toString', 'call'], { x: 1 });

			expect(Object.prototype.toString.call).toBe(original);
			expect(Object.prototype.toString.call([])).toBe('[object Array]');
			// kept as harmless own data on the target
			expect(r['toString']).toEqual({ call: { x: 1 } });
		});

		test('does not corrupt Object.prototype via a builtin key deep in the path', () => {
			const original = Object.prototype.toString.call;

			setDeep(root(), ['real_relation', 'toString', 'call'], { x: 1 });

			expect(Object.prototype.toString.call).toBe(original);
			expect(Object.prototype.toString.call({})).toBe('[object Object]');
		});

		test('does not pollute the prototype chain via __proto__', () => {
			const r = setDeep(root(), ['__proto__', 'polluted'], 'yes');

			expect(({} as any).polluted).toBeUndefined();
			expect(Object.getPrototypeOf(r)).toBeNull();
			expect(Object.prototype.hasOwnProperty.call(r, '__proto__')).toBe(true);
		});

		test.each([['constructor'], ['prototype'], ['valueOf'], ['hasOwnProperty']])(
			'keeps builtin-named key %s as own data without corrupting the prototype',
			(key) => {
				const before = Object.getOwnPropertyDescriptor(Object.prototype, key);

				const r = setDeep(root(), [key, 'x'], 1);

				expect(Object.getOwnPropertyDescriptor(Object.prototype, key)).toEqual(before);
				expect(r[key]).toEqual({ x: 1 });
			},
		);
	});
});
