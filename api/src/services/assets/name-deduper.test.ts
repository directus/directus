import { describe, expect, test } from 'vitest';
import { NameDeduper } from './name-deduper.js';

describe('NameDeduper', () => {
	test('creating file deduper', () => {
		const deduper = new NameDeduper();

		expect(deduper).toBeDefined();
	});

	test('adding a single file', () => {
		const deduper = new NameDeduper();

		expect(deduper.add('abc')).toEqual('abc');
	});

	test('adding two different files', () => {
		const deduper = new NameDeduper();

		expect(deduper.add('abc')).toEqual('abc');
		expect(deduper.add('def')).toEqual('def');
	});

	test('adding 3 duplicate files', () => {
		const deduper = new NameDeduper();

		expect(deduper.add('abc')).toEqual('abc');
		expect(deduper.add('abc')).toEqual('abc (1)');
		expect(deduper.add('abc')).toEqual('abc (2)');
	});

	test('adding 3 duplicate files to the same folder', () => {
		const deduper = new NameDeduper();

		expect(deduper.add('abc', { group: 'folder1' })).toEqual('abc');
		expect(deduper.add('abc', { group: 'folder1' })).toEqual('abc (1)');
		expect(deduper.add('abc', { group: 'folder1' })).toEqual('abc (2)');
	});

	test('adding two duplicate files in different folders', () => {
		const deduper = new NameDeduper();

		expect(deduper.add('abc')).toEqual('abc');
		expect(deduper.add('abc', { group: 'folder1' })).toEqual('abc');
	});

	test('adding two different files to different folders', () => {
		const deduper = new NameDeduper();

		expect(deduper.add('abc', { group: 'folder1' })).toEqual('abc');
		expect(deduper.add('def', { group: 'folder2' })).toEqual('def');
	});

	test('should sanitize name', () => {
		const deduper = new NameDeduper();

		expect(deduper.add('./../test', { group: 'folder1' })).toEqual('...test');
	});

	test('should fallback when name sanitized to empty', () => {
		const deduper = new NameDeduper();

		expect(deduper.add('...', { group: 'folder1', fallback: '123' })).toEqual('123');
	});

	test('should error when name sanitized to empty and no fallback', () => {
		const deduper = new NameDeduper();

		expect(() => deduper.add('...', { group: 'folder1' })).toThrow(Error);
	});
});
