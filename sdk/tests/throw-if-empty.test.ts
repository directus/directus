import { describe, expect, test } from 'vitest';
import { throwIfEmpty } from '../src/rest/utils/throw-if-empty.js';

describe('throwIfEmpty', () => {
	test('throws when given an empty string', () => {
		expect(() => throwIfEmpty('', 'message')).toThrowError('message');
	});

	test('throws when given an empty array', () => {
		expect(() => throwIfEmpty([], 'message')).toThrowError('message');
	});

	test('does not throw when given a non-empty string', () => {
		expect(() => throwIfEmpty('collection', 'message')).not.toThrow();
	});

	test('does not throw when given a non-empty array', () => {
		expect(() => throwIfEmpty(['id'], 'message')).not.toThrow();
	});

	test('throws when given undefined', () => {
		expect(() => throwIfEmpty(undefined as unknown as string, 'message')).toThrowError('message');
	});

	test('throws when given null', () => {
		expect(() => throwIfEmpty(null as unknown as string, 'message')).toThrowError('message');
	});

	test('throws when given a numeric key of undefined, without requiring the caller to String() it first', () => {
		expect(() => throwIfEmpty(undefined as unknown as number, 'message')).toThrowError('message');
	});

	test('throws when given a numeric key of null, without requiring the caller to String() it first', () => {
		expect(() => throwIfEmpty(null as unknown as number, 'message')).toThrowError('message');
	});

	test('does not throw when given a typical non-zero numeric key', () => {
		expect(() => throwIfEmpty(5, 'message')).not.toThrow();
	});

	test('does not throw when given the numeric key 0', () => {
		expect(() => throwIfEmpty(0, 'message')).not.toThrow();
	});
});
