import { describe, expect, test } from 'vitest';
import { collectAllFolderIds } from './collect-folder-ids';

const allFolders = [
	{ id: 'root-1', name: 'Root 1', parent: null },
	{ id: 'root-2', name: 'Root 2', parent: null },
	{ id: 'child-1a', name: 'Child 1A', parent: 'root-1' },
	{ id: 'child-1b', name: 'Child 1B', parent: 'root-1' },
	{ id: 'grandchild-1a-i', name: 'Grandchild 1A-I', parent: 'child-1a' },
	{ id: 'child-2a', name: 'Child 2A', parent: 'root-2' },
];

describe('collectAllFolderIds', () => {
	test('returns root ids when no children', () => {
		const result = collectAllFolderIds(allFolders, ['root-2']);
		expect(result).toContain('root-2');
		expect(result).toContain('child-2a');
		expect(result).not.toContain('root-1');
	});

	test('recursively collects nested children', () => {
		const result = collectAllFolderIds(allFolders, ['root-1']);
		expect(result).toEqual(expect.arrayContaining(['root-1', 'child-1a', 'child-1b', 'grandchild-1a-i']));
		expect(result).not.toContain('root-2');
		expect(result).not.toContain('child-2a');
	});

	test('handles multiple root ids', () => {
		const result = collectAllFolderIds(allFolders, ['root-1', 'root-2']);

		expect(result).toEqual(
			expect.arrayContaining(['root-1', 'root-2', 'child-1a', 'child-1b', 'grandchild-1a-i', 'child-2a']),
		);
	});

	test('returns only the root when it has no children', () => {
		const result = collectAllFolderIds([{ id: 'lone', name: 'Lone', parent: null }], ['lone']);
		expect(result).toEqual(['lone']);
	});

	test('empty rootIds returns empty array', () => {
		const result = collectAllFolderIds(allFolders, []);
		expect(result).toEqual([]);
	});

	test('empty allFolders returns rootIds', () => {
		const result = collectAllFolderIds([], ['root-1']);
		expect(result).toEqual(['root-1']);
	});

	test('handles cyclic parent references without infinite loop', () => {
		const cyclic = [
			{ id: 'a', name: 'A', parent: 'b' },
			{ id: 'b', name: 'B', parent: 'a' },
		];

		const result = collectAllFolderIds(cyclic, ['a']);
		expect(result).toEqual(expect.arrayContaining(['a', 'b']));
	});
});
