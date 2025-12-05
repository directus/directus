import { expect, test } from 'vitest';
import { NameDeduper } from './name-deduper.js';

test('creating file deduper', () => {
	const deduper = new NameDeduper();

	expect(deduper).toBeDefined();
});

test('adding a single file', () => {
	const deduper = new NameDeduper();

	expect(deduper.add('abc')).toEqual('abc');
});

test('adding a two different files', () => {
	const deduper = new NameDeduper();

	expect(deduper.add('abc')).toEqual('abc');
	expect(deduper.add('def')).toEqual('def');
});

test('adding a 3 duplicate files', () => {
	const deduper = new NameDeduper();

	expect(deduper.add('abc')).toEqual('abc');
	expect(deduper.add('abc')).toEqual('abc (1)');
	expect(deduper.add('abc')).toEqual('abc (2)');
});

test('adding a 3 duplicate files to the same folder', () => {
	const deduper = new NameDeduper();

	expect(deduper.add('abc', 'folder1')).toEqual('abc');
	expect(deduper.add('abc', 'folder1')).toEqual('abc (1)');
	expect(deduper.add('abc', 'folder1')).toEqual('abc (2)');
});

test('adding a two duplicate files in different folders', () => {
	const deduper = new NameDeduper();

	expect(deduper.add('abc')).toEqual('abc');
	expect(deduper.add('abc', 'folder1')).toEqual('abc');
});

test('adding a two different files to different folders', () => {
	const deduper = new NameDeduper();

	expect(deduper.add('abc', 'folder1')).toEqual('abc');
	expect(deduper.add('def', 'folder2')).toEqual('def');
});
