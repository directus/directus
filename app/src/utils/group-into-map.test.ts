import { expect, test } from 'vitest';
import { groupIntoMap } from './group-into-map';

test('groups items by key in order', () => {
	const groups = groupIntoMap(
		[
			{ id: 1, group: 'a' },
			{ id: 2, group: 'b' },
			{ id: 3, group: 'a' },
		],
		(item) => item.group,
	);

	expect([...groups.keys()]).toEqual(['a', 'b']);
	expect(groups.get('a')!.map((item) => item.id)).toEqual([1, 3]);
});

test('adds an item under each distinct key', () => {
	const groups = groupIntoMap([{ id: 1, keys: ['a', 'b', 'a'] }], (item) => item.keys);

	expect(groups.get('a')).toHaveLength(1);
	expect(groups.get('b')).toHaveLength(1);
});

test('handles keys that exist on Object.prototype', () => {
	const groups = groupIntoMap([{ id: 1, group: 'a' }], (item) => item.group);

	expect(groups.get('constructor')).toBeUndefined();
});
