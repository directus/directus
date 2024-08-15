import { describe, expect, test } from 'vitest';
import { valueIsAFunction } from './is-a-function.js';

describe('should pass validation', () => {
	test('simple function', () => {
		expect(valueIsAFunction('doSomething()')).toBe(true);
	});

	test('function with underscore', () => {
		expect(valueIsAFunction('do_something()')).toBe(true);
	});
});

describe('should not pass validation', () => {
	test('no parentheses at all', () => {
		expect(valueIsAFunction('doSomething')).toBe(false);
	});

	test('whitespace', () => {
		expect(valueIsAFunction('doSomething( )')).toBe(false);
		expect(valueIsAFunction('doSomething ()')).toBe(false);
		expect(valueIsAFunction(' doSomething ()')).toBe(false);
	});

	test('with any kind of parameters', () => {
		expect(valueIsAFunction('doSomething(1,2)')).toBe(false);
		expect(valueIsAFunction('doSomething("one")')).toBe(false);
		expect(valueIsAFunction("doSomething('oe')")).toBe(false);
		expect(valueIsAFunction('doSomething(with(something))')).toBe(false);
	});

	test('no closing parentheses at the end', () => {
		expect(valueIsAFunction('doSomething(')).toBe(false);
		expect(valueIsAFunction('doSomething();')).toBe(false);
		expect(valueIsAFunction('doSomething() ')).toBe(false);
	});

	test('SQL injections', () => {
		expect(valueIsAFunction('"SELECT * FROM users;"')).toBe(false);
		expect(valueIsAFunction('SELECT * FROM users;')).toBe(false);
		expect(valueIsAFunction('some_func(;DROP DATABASE;)')).toBe(false);
		expect(valueIsAFunction('doSomething() DO')).toBe(false);
		expect(valueIsAFunction('doSomething(); DROP DATABASE; --')).toBe(false);
	});

	test('start with parentheses', () => {
		expect(valueIsAFunction('()doSomething()')).toBe(false);
	});

	test('starts with a number', () => {
		expect(valueIsAFunction('123do_something()')).toBe(false);
	});

	test('escaping', () => {
		expect(valueIsAFunction("doSomething('it\\'s not okay')")).toBe(false);
		expect(valueIsAFunction("doSomething\\'doStuff\\'()")).toBe(false);
		expect(valueIsAFunction(`doSomething\\"doStuff\\"()`)).toBe(false);
		expect(valueIsAFunction("doSomething'doStuff'()")).toBe(false);
		expect(valueIsAFunction(`doSomething"doStuff"()`)).toBe(false);
	});

	test('single backslash for ascii chars', () => {
		expect(valueIsAFunction('doSomething\u0020()')).toBe(false);
		expect(valueIsAFunction('doSomething(\u0020)')).toBe(false);
	});

	test('Comments included ', () => {
		expect(valueIsAFunction('call/* SQL */()')).toBe(false);
	});
});
