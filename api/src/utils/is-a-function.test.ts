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

	test('with parameters', () => {
		expect(valueIsAFunction('doSomething(1,2)')).toBe(true);
		expect(valueIsAFunction('doSomething("one")')).toBe(true);
		expect(valueIsAFunction("doSomething('oe')")).toBe(true);
	});

	test('with whitespace', () => {
		expect(valueIsAFunction('do_something( )')).toBe(true);
		expect(valueIsAFunction('doSomething (1, with(true) )')).toBe(true);
		expect(valueIsAFunction('doSomething\u0020()')).toBe(true);
	});

	test('multiple nested functions with space', () => {
		expect(valueIsAFunction('doSomething(with(something), and(somethingElse, 2))')).toBe(true);
	});

	test('Comments included ', () => {
		expect(valueIsAFunction('nested(call(/* SQL */))')).toBe(true);
	});
});

describe('should not pass validation', () => {
	test('no parentheses at all', () => {
		expect(valueIsAFunction('doSomething')).toBe(false);
	});

	test('No closing parentheses at the end', () => {
		expect(valueIsAFunction('doSomething(')).toBe(false);
		expect(valueIsAFunction('doSomething();')).toBe(false);
		expect(valueIsAFunction('doSomething() DO')).toBe(false);
		expect(valueIsAFunction('doSomething() DO SOMETHING; --')).toBe(false);
		expect(valueIsAFunction('"SELECT * FROM users;"')).toBe(false);
		expect(valueIsAFunction('SELECT * FROM users;')).toBe(false);
	});

	test('No real parameters', () => {
		expect(valueIsAFunction('some_func(;DROP DATABASE;)')).toBe(false);
	});

	test('start with parentheses', () => {
		expect(valueIsAFunction('()doSomething()')).toBe(false);
	});

	test('unbalances brakes or quotes', () => {
		expect(valueIsAFunction('doSomething(')).toBe(false);
		expect(valueIsAFunction('doSomething)')).toBe(false);
		expect(valueIsAFunction('doSomething(with()')).toBe(false);
		expect(valueIsAFunction('doSomething("one, "two")')).toBe(false);
	});

	test('starts with a number', () => {
		expect(valueIsAFunction('123do_something()')).toBe(false);
	});

	test('escaping with backslashes', () => {
		expect(valueIsAFunction("doSomething('it\\'s not okay')")).toBe(false);
	});
});
