import { describe, expect, test } from 'vitest';
import { valueIsAFunction } from './is-a-function.js';

describe('should pass validation', () => {
	test('simple function', () => {
		expect(valueIsAFunction('doSomething()')).toBe(true);
	});

	test('function with underscore', () => {
		expect(valueIsAFunction('do_something()')).toBe(true);
	});

	test('one nested function', () => {
		expect(valueIsAFunction('doSomething(with(something))')).toBe(true);
	});

	test('multiple nested functions with space', () => {
		expect(valueIsAFunction('doSomething(with(something), and(somethingElse, 2))')).toBe(true);
	});
});

describe('should not pass validation', () => {
	test('no parentheses at all', () => {
		expect(valueIsAFunction('doSomething')).toBe(false);
	});

	test('function with dash', () => {
		expect(valueIsAFunction('do-something()')).toBe(true);
	});

	test('start with parentheses', () => {
		expect(valueIsAFunction('()doSomething()')).toBe(true);
	});

	test('unbalances brakes', () => {
		expect(valueIsAFunction('doSomething(with()')).toBe(true);
	});
});
