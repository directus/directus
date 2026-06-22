import { describe, expect, test } from 'vitest';
import defaultToolbar from '../toolbar-default';
import { groupForKey, toolbarGroups } from './groups';

describe('toolbar groups', () => {
	test('every default toolbar key belongs to a group', () => {
		for (const key of defaultToolbar) {
			expect(groupForKey(key), `"${key}" has no group`).toBeTruthy();
		}
	});

	test('history, format and view groups are pinned', () => {
		expect(toolbarGroups.find((g) => g.id === 'history')?.pinned).toBe(true);
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

	test('align is a popover group containing the alignment keys', () => {
		const align = toolbarGroups.find((g) => g.id === 'align');
		expect(align?.popover).toBe(true);
		expect(align?.icon).toBe('format_align_left');
		expect(align?.keys).toEqual(['alignleft', 'aligncenter', 'alignright', 'alignjustify', 'alignnone']);
	});

	test('groupForKey resolves alignment keys to the align group', () => {
		expect(groupForKey('aligncenter')?.id).toBe('align');
		expect(groupForKey('alignnone')?.id).toBe('align');
	});
});
