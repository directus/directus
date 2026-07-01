import type { ToolbarGroup } from './groups';

export interface RenderGroup {
	id: string;
	keys: string[];
	popover?: boolean;
	icon?: string;
}

export interface LayoutMeasurements {
	buttonWidth: number;
	gap: number;
	moreWidth: number;
	separatorWidth: number;
	minItems: number;
	popoverWidth: number;
	/** Per-key width overrides for non-square buttons (e.g. labeled dropdowns); defaults to buttonWidth. */
	keyWidths?: Record<string, number>;
}

export interface ToolbarLayout {
	visible: RenderGroup[];
	overflow: RenderGroup[];
}

interface Candidate {
	id: string;
	priority: number;
	pinned: boolean;
	popover: boolean;
	icon?: string;
	keys: string[];
}

const OTHER_GROUP_ID = 'other';

// a popover group collapses to a single button; everything else is one slot per key
function slotsOf(g: { popover?: boolean; keys: string[] }): number {
	return g.popover ? 1 : g.keys.length;
}

function widthOf(g: { popover?: boolean; keys: string[] }, m: LayoutMeasurements): number {
	// popover groups collapse to one fixed-width button; otherwise sum per-key widths (labeled dropdowns
	// are wider than square buttons), falling back to the default button width.
	return g.popover ? m.popoverWidth : g.keys.reduce((w, k) => w + (m.keyWidths?.[k] ?? m.buttonWidth), 0);
}

function partition(selectedKeys: string[], groups: ToolbarGroup[]): Candidate[] {
	const known = new Set<string>();
	for (const g of groups) for (const k of g.keys) known.add(k);

	const selected = new Set(selectedKeys);
	const candidates: Candidate[] = [];

	for (const g of groups) {
		const keys = g.keys.filter((k) => selected.has(k));
		if (keys.length)
			candidates.push({
				id: g.id,
				priority: g.priority,
				pinned: Boolean(g.pinned),
				popover: Boolean(g.popover),
				icon: g.icon,
				keys,
			});
	}

	const orphans = selectedKeys.filter((k) => !known.has(k));
	if (orphans.length)
		candidates.push({ id: OTHER_GROUP_ID, priority: -Infinity, pinned: false, popover: false, keys: orphans });

	return candidates.sort((a, b) => b.priority - a.priority);
}

function slotCount(groups: { popover?: boolean; keys: string[] }[]): number {
	return groups.reduce((n, g) => n + slotsOf(g), 0);
}

function measure(groups: { popover?: boolean; keys: string[] }[], hasOverflow: boolean, m: LayoutMeasurements): number {
	const slots = slotCount(groups);
	const moreButtons = hasOverflow ? 1 : 0;
	// separators sit between groups, plus one before the Show More button when it's present
	const separators = Math.max(0, groups.length - 1) + moreButtons;
	const children = slots + separators + moreButtons;
	if (children === 0) return 0;

	const widths =
		groups.reduce((w, g) => w + widthOf(g, m), 0) + separators * m.separatorWidth + moreButtons * m.moreWidth;

	return widths + (children - 1) * m.gap;
}

export function computeToolbarLayout(
	selectedKeys: string[],
	groups: ToolbarGroup[],
	availableWidth: number,
	m: LayoutMeasurements,
): ToolbarLayout {
	const candidates = partition(selectedKeys, groups);
	const totalSlots = slotCount(candidates);

	const render = (c: Candidate, keys: string[] = c.keys): RenderGroup => ({
		id: c.id,
		keys: [...keys],
		popover: c.popover,
		icon: c.icon,
	});

	if (totalSlots === 0 || measure(candidates, false, m) <= availableWidth) {
		return { visible: candidates.map((c) => render(c)), overflow: [] };
	}

	// Keep-priority order: pinned groups collapse LAST (sorted ahead of non-pinned), then by priority desc.
	// Nothing is force-visible — every group, pinned or not, can fall into "Show More" — so the visible row
	// never clips the toolbar; pinned just stay accessible the longest. (The min-items floor below is the
	// only thing that can push past the width, to avoid an almost-empty toolbar on a very narrow field.)
	const keepRank = (c: Candidate) => (c.pinned ? 1 : 0);
	const keepOrder = [...candidates].sort((a, b) => keepRank(b) - keepRank(a) || b.priority - a.priority);

	// greedy: add groups in keep-priority order while the visible row (incl. the Show More button) still fits
	const visibleIds = new Set<string>();

	for (const c of keepOrder) {
		const trial = candidates.filter((x) => visibleIds.has(x.id) || x.id === c.id);
		const hasOverflow = trial.length < candidates.length;
		if (measure(trial, hasOverflow, m) <= availableWidth) visibleIds.add(c.id);
		else break; // first group that doesn't fit; everything lower in keep-order stays in overflow
	}

	// floor: guarantee >= minVisible slots even on a very narrow toolbar, pulling groups back in
	// keep-priority order (so pinned groups are restored first)
	const minVisible = Math.min(m.minItems, totalSlots);
	const prio = new Map(candidates.map((c) => [c.id, c.priority]));

	const visible: RenderGroup[] = candidates.filter((c) => visibleIds.has(c.id)).map((c) => render(c));

	const overflow: RenderGroup[] = [];
	let visibleCount = slotCount(visible);

	for (const c of keepOrder) {
		if (visibleIds.has(c.id)) continue; // already visible

		if (visibleCount >= minVisible) {
			overflow.push(render(c));
			continue;
		}

		const need = minVisible - visibleCount;

		// popover groups are atomic: pull the whole thing as one slot, never slice
		if (c.popover || c.keys.length <= need) {
			visible.push(render(c));
			visibleCount += slotsOf(c);
		} else {
			visible.push(render(c, c.keys.slice(0, need)));
			overflow.push(render(c, c.keys.slice(need)));
			visibleCount += need;
		}
	}

	const byPriority = (a: RenderGroup, b: RenderGroup) => (prio.get(b.id) ?? -Infinity) - (prio.get(a.id) ?? -Infinity);
	visible.sort(byPriority);
	overflow.sort(byPriority);

	return { visible, overflow };
}
