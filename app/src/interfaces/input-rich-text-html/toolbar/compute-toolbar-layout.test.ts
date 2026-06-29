import { describe, expect, test } from 'vitest';
import { toolbarButtons } from './buttons';
import { computeToolbarLayout, type LayoutMeasurements } from './compute-toolbar-layout';
import { type ToolbarGroup, toolbarGroups } from './groups';

const GROUPS: ToolbarGroup[] = [
	{ id: 'format', priority: 100, pinned: true, keys: ['bold', 'italic', 'underline'] },
	{ id: 'list', priority: 80, keys: ['numlist', 'bullist'] },
	{ id: 'insert', priority: 60, keys: ['link', 'image'] },
	{ id: 'view', priority: 10, pinned: true, keys: ['fullscreen'] },
];

const ALL = ['bold', 'italic', 'underline', 'numlist', 'bullist', 'link', 'image', 'fullscreen'];

// gap 0 keeps the arithmetic obvious
const M: LayoutMeasurements = {
	buttonWidth: 30,
	gap: 0,
	moreWidth: 30,
	separatorWidth: 10,
	minItems: 5,
	popoverWidth: 40,
};

const POPOVER_GROUPS: ToolbarGroup[] = [
	{ id: 'format', priority: 100, pinned: true, keys: ['bold', 'italic', 'underline'] },
	{
		id: 'align',
		priority: 75,
		popover: true,
		icon: 'format_align_left',
		keys: ['alignleft', 'aligncenter', 'alignright', 'alignjustify'],
	},
	{ id: 'list', priority: 70, keys: ['numlist', 'bullist'] },
	{ id: 'view', priority: 10, pinned: true, keys: ['fullscreen'] },
];

const POPOVER_ALL = [
	'bold',
	'italic',
	'underline',
	'alignleft',
	'aligncenter',
	'alignright',
	'alignjustify',
	'numlist',
	'bullist',
	'fullscreen',
];

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

	test('floor keeps >=5 items at width 0, restoring highest keep-priority (pinned first)', () => {
		const { visible, overflow } = computeToolbarLayout(ALL, GROUPS, 0, M);
		// floor pulls back in keep-priority order, so the pinned groups are restored first
		expect(ids(visible)).toContain('format');
		expect(ids(visible)).toContain('view');
		expect(ids(overflow)).not.toContain('format');
		expect(ids(overflow)).not.toContain('view');
		// floor: exactly 5 items visible (format 3 + view 1 + one pulled-back item)
		expect(count(visible)).toBe(5);
		// view renders last among visible groups (fullscreen before Show More)
		expect(ids(visible).at(-1)).toBe('view');
		// the split group's remainder lives in overflow
		expect(count(visible) + count(overflow)).toBe(ALL.length);
	});

	test('pinned groups collapse last: a low-priority pinned group stays while a higher-priority non-pinned one overflows', () => {
		// pinned slots (p1:3 + p2:3 = 6) already exceed minItems, so the floor never interferes here
		const groups: ToolbarGroup[] = [
			{ id: 'p1', priority: 100, pinned: true, keys: ['a', 'b', 'c'] },
			{ id: 'mid', priority: 80, keys: ['d', 'e'] },
			{ id: 'p2', priority: 10, pinned: true, keys: ['f', 'g', 'h'] },
		];

		const sel = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
		// width 230 fits both pinned groups (6 slots) but not the non-pinned 'mid'
		const { visible, overflow } = computeToolbarLayout(sel, groups, 230, M);
		expect(ids(visible)).toContain('p1'); // pinned, highest keep
		expect(ids(visible)).toContain('p2'); // pinned, priority 10 — kept over higher-priority non-pinned
		expect(ids(visible)).not.toContain('mid'); // non-pinned, priority 80 — collapsed first
		expect(ids(overflow)).toContain('mid');
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

	test('a popover group renders as one atomic slot, carrying its flag and icon', () => {
		const { visible } = computeToolbarLayout(POPOVER_ALL, POPOVER_GROUPS, Infinity, M);
		const align = visible.find((g) => g.id === 'align');
		expect(align?.popover).toBe(true);
		expect(align?.icon).toBe('format_align_left');
		// all 4 align keys stay together in the single popover slot
		expect(align?.keys).toEqual(['alignleft', 'aligncenter', 'alignright', 'alignjustify']);
	});

	test('a popover group measures as one slot, not one-per-key', () => {
		// visible-row budget for: format(3*30) + align(1*40 popover) + list(2*30) + view(1*30)
		//   = 90 + 40 + 60 + 30 = 220, plus 3 separators(10) = 30 => 250. gap 0.
		// At 250 everything fits with no overflow; if align were measured as 4*30=120 it would not.
		const { overflow } = computeToolbarLayout(POPOVER_ALL, POPOVER_GROUPS, 250, M);
		expect(overflow).toEqual([]);
	});

	test('a popover group overflows atomically (never sliced)', () => {
		// Width 0 forces the floor. format(3) + view(1) pinned = 4 slots; need 1 more to reach minItems 5.
		// The next-highest non-pinned group is the popover 'align' (1 slot) -> pulled whole, not sliced.
		const { visible, overflow } = computeToolbarLayout(POPOVER_ALL, POPOVER_GROUPS, 0, M);
		const align = visible.find((g) => g.id === 'align');
		expect(align?.keys).toEqual(['alignleft', 'aligncenter', 'alignright', 'alignjustify']); // whole, not a slice
		// it must not appear in both visible and overflow
		expect(overflow.find((g) => g.id === 'align')).toBeUndefined();
	});

	// Regression suite against the REAL toolbar config: a wide pinned group (font family/size) must
	// collapse into "Show More" rather than overflow the toolbar and clip the button.
	describe('real config never clips the visible row (CMS-2637 regression)', () => {
		// mirror the component's MEASUREMENTS, deriving the labeled-dropdown widths from the registry
		const keyWidths = Object.fromEntries(
			Object.entries(toolbarButtons)
				.filter(([, button]) => button.width !== undefined)
				.map(([key, button]) => [key, button.width!]),
		);

		const REAL_M: LayoutMeasurements = {
			buttonWidth: 32,
			gap: 2,
			moreWidth: 32,
			separatorWidth: 9,
			minItems: 5,
			popoverWidth: 44,
			keyWidths,
		};

		// the full set including the wide font/color dropdowns
		const FONT_TOOLBAR = [
			'bold',
			'italic',
			'underline',
			'fontfamily',
			'fontsize',
			'forecolor',
			'backcolor',
			'h1',
			'h2',
			'h3',
			'numlist',
			'bullist',
			'removeformat',
			'blockquote',
			'customLink',
			'customImage',
			'customMedia',
			'hr',
			'code',
			'fullscreen',
		];

		// rendered width of a set of groups, mirroring the private `measure()`
		const renderedWidth = (groups: { popover?: boolean; keys: string[] }[], hasOverflow: boolean) => {
			const widthOf = (g: { popover?: boolean; keys: string[] }) =>
				g.popover ? REAL_M.popoverWidth : g.keys.reduce((w, k) => w + (keyWidths[k] ?? REAL_M.buttonWidth), 0);

			const slots = groups.reduce((n, g) => n + (g.popover ? 1 : g.keys.length), 0);
			const seps = Math.max(0, groups.length - 1) + (hasOverflow ? 1 : 0);
			const more = hasOverflow ? 1 : 0;
			const width = groups.reduce((w, g) => w + widthOf(g), 0) + seps * REAL_M.separatorWidth + more * REAL_M.moreWidth;
			return width + Math.max(0, slots + seps + more - 1) * REAL_M.gap;
		};

		test('a wide pinned group collapses instead of forcing the visible row to overflow', () => {
			// priority-independent: a 300px-wide pinned group can't fit, so it falls into Show More
			// rather than staying visible and clipping the toolbar
			const groups: ToolbarGroup[] = [
				{ id: 'narrow', priority: 100, pinned: true, keys: ['a', 'b'] },
				{ id: 'wide', priority: 50, pinned: true, keys: ['w'] },
				{ id: 'extra', priority: 10, keys: ['c', 'd', 'e'] },
			];

			const m: LayoutMeasurements = { ...M, minItems: 2, keyWidths: { w: 300 } };
			const { visible, overflow } = computeToolbarLayout(['a', 'b', 'w', 'c', 'd', 'e'], groups, 120, m);
			expect(ids(visible)).not.toContain('wide');
			expect(ids(overflow)).toContain('wide');
		});

		test('the visible row never exceeds the toolbar width (except when the min-items floor applies)', () => {
			for (let width = 300; width <= 900; width += 25) {
				const { visible, overflow } = computeToolbarLayout(FONT_TOOLBAR, toolbarGroups, width, REAL_M);
				const visibleSlots = visible.reduce((n, g) => n + (g.popover ? 1 : g.keys.length), 0);

				// the floor (minItems) is the only thing allowed to push past the width
				if (overflow.length > 0 && visibleSlots > REAL_M.minItems) {
					expect(renderedWidth(visible, true)).toBeLessThanOrEqual(width);
				}
			}
		});
	});
});
