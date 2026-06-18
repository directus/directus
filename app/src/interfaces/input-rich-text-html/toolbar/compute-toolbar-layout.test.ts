import { describe, expect, test } from 'vitest';
import { computeToolbarLayout, type LayoutMeasurements } from './compute-toolbar-layout';
import type { ToolbarGroup } from './groups';

const GROUPS: ToolbarGroup[] = [
	{ id: 'format', priority: 100, pinned: true, keys: ['bold', 'italic', 'underline'] },
	{ id: 'list', priority: 80, keys: ['numlist', 'bullist'] },
	{ id: 'insert', priority: 60, keys: ['link', 'image'] },
	{ id: 'view', priority: 10, pinned: true, keys: ['fullscreen'] },
];

const ALL = ['bold', 'italic', 'underline', 'numlist', 'bullist', 'link', 'image', 'fullscreen'];

// gap 0 keeps the arithmetic obvious
const M: LayoutMeasurements = { buttonWidth: 30, gap: 0, moreWidth: 30, separatorWidth: 10, minItems: 5 };

const ids = (groups: { id: string }[]) => groups.map((g) => g.id);
const count = (groups: { keys: string[] }[]) => groups.reduce((n, g) => n + g.keys.length, 0);

describe('computeToolbarLayout', () => {
	test('infinite width shows every group in priority order, no overflow', () => {
		const { visible, overflow } = computeToolbarLayout(ALL, GROUPS, Infinity, M);
		expect(ids(visible)).toEqual(['format', 'list', 'insert', 'view']);
		expect(overflow).toEqual([]);
	});

	test('nothing selected returns empty layout', () => {
		expect(computeToolbarLayout([], GROUPS, 100, M)).toEqual({ visible: [], overflow: [] });
	});

	test('pinned groups never overflow and floor keeps >=5 items at width 0', () => {
		const { visible, overflow } = computeToolbarLayout(ALL, GROUPS, 0, M);
		// pinned always present in visible
		expect(ids(visible)).toContain('format');
		expect(ids(visible)).toContain('view');
		// pinned never in overflow
		expect(ids(overflow)).not.toContain('format');
		expect(ids(overflow)).not.toContain('view');
		// floor: exactly 5 items visible (format 3 + view 1 + one pulled-back item)
		expect(count(visible)).toBe(5);
		// view renders last among visible groups (fullscreen before Show More)
		expect(ids(visible).at(-1)).toBe('view');
		// the split group's remainder lives in overflow
		expect(count(visible) + count(overflow)).toBe(ALL.length);
	});

	test('floor is capped at total items when only pinned are selected', () => {
		const sel = ['bold', 'italic', 'fullscreen'];
		const { visible, overflow } = computeToolbarLayout(sel, GROUPS, 0, M);
		expect(count(visible)).toBe(3);
		expect(overflow).toEqual([]);
	});

	test('unknown keys fall into a lowest-priority "other" group, ordered last', () => {
		const { visible } = computeToolbarLayout([...ALL, 'mystery'], GROUPS, Infinity, M);
		expect(ids(visible).at(-1)).toBe('other');
		expect(visible.at(-1)?.keys).toEqual(['mystery']);
	});
});
