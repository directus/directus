import { describe, expect, test } from 'vitest';
import defaultToolbar from '../toolbar-default';
import { groupForKey, toolbarGroups } from './groups';

describe('toolbar groups', () => {
	test('every default toolbar key belongs to a group', () => {
		for (const key of defaultToolbar) {
			expect(groupForKey(key), `"${key}" has no group`).toBeTruthy();
		}
	});

	test('format and view groups are pinned', () => {
		expect(toolbarGroups.find((g) => g.id === 'format')?.pinned).toBe(true);
		expect(toolbarGroups.find((g) => g.id === 'view')?.pinned).toBe(true);
	});

	test('no key appears in two groups', () => {
		const seen = new Set<string>();

		for (const g of toolbarGroups) {
			for (const k of g.keys) {
				expect(seen.has(k), `"${k}" duplicated`).toBe(false);
				seen.add(k);
			}
		}
	});
});
