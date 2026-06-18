import type { ToolbarGroup } from './groups';

export interface RenderGroup {
	id: string;
	keys: string[];
}

export interface LayoutMeasurements {
	buttonWidth: number;
	gap: number;
	moreWidth: number;
	separatorWidth: number;
	minItems: number;
}

export interface ToolbarLayout {
	visible: RenderGroup[];
	overflow: RenderGroup[];
}

interface Candidate {
	id: string;
	priority: number;
	pinned: boolean;
	keys: string[];
}

const OTHER_GROUP_ID = 'other';

function partition(selectedKeys: string[], groups: ToolbarGroup[]): Candidate[] {
	const known = new Set<string>();
	for (const g of groups) for (const k of g.keys) known.add(k);

	const selected = new Set(selectedKeys);
	const candidates: Candidate[] = [];

	for (const g of groups) {
		const keys = g.keys.filter((k) => selected.has(k));
		if (keys.length) candidates.push({ id: g.id, priority: g.priority, pinned: Boolean(g.pinned), keys });
	}

	const orphans = selectedKeys.filter((k) => !known.has(k));
	if (orphans.length) candidates.push({ id: OTHER_GROUP_ID, priority: -Infinity, pinned: false, keys: orphans });

	return candidates.sort((a, b) => b.priority - a.priority);
}

function itemCount(groups: { keys: string[] }[]): number {
	return groups.reduce((n, g) => n + g.keys.length, 0);
}

function measure(groups: { keys: string[] }[], hasOverflow: boolean, m: LayoutMeasurements): number {
	const items = itemCount(groups);
	const separators = Math.max(0, groups.length - 1);
	const moreButtons = hasOverflow ? 1 : 0;
	const children = items + separators + moreButtons;
	if (children === 0) return 0;
	const widths = items * m.buttonWidth + separators * m.separatorWidth + moreButtons * m.moreWidth;
	return widths + (children - 1) * m.gap;
}

export function computeToolbarLayout(
	selectedKeys: string[],
	groups: ToolbarGroup[],
	availableWidth: number,
	m: LayoutMeasurements,
): ToolbarLayout {
	const candidates = partition(selectedKeys, groups);
	const totalItems = itemCount(candidates);
	const toRender = (cs: Candidate[]): RenderGroup[] => cs.map((c) => ({ id: c.id, keys: [...c.keys] }));

	if (totalItems === 0 || measure(candidates, false, m) <= availableWidth) {
		return { visible: toRender(candidates), overflow: [] };
	}

	// greedy: pinned always visible; add non-pinned high->low while they fit
	const visibleIds = new Set(candidates.filter((c) => c.pinned).map((c) => c.id));

	for (const c of candidates) {
		if (c.pinned || visibleIds.has(c.id)) continue;
		const trial = candidates.filter((x) => visibleIds.has(x.id) || x.id === c.id);
		const hasOverflow = trial.length < candidates.length;
		if (measure(trial, hasOverflow, m) <= availableWidth) visibleIds.add(c.id);
		else break; // lowest-priority groups stay in overflow
	}

	// floor: pull highest-priority overflow groups back until >= minVisible items
	const minVisible = Math.min(m.minItems, totalItems);
	const prio = new Map(candidates.map((c) => [c.id, c.priority]));

	const visible: RenderGroup[] = candidates
		.filter((c) => visibleIds.has(c.id))
		.map((c) => ({ id: c.id, keys: [...c.keys] }));

	const overflow: RenderGroup[] = [];
	let visibleCount = itemCount(visible);

	for (const c of candidates) {
		if (visibleIds.has(c.id)) continue; // already visible

		if (visibleCount >= minVisible) {
			overflow.push({ id: c.id, keys: [...c.keys] });
			continue;
		}

		const need = minVisible - visibleCount;

		if (c.keys.length <= need) {
			visible.push({ id: c.id, keys: [...c.keys] });
			visibleCount += c.keys.length;
		} else {
			visible.push({ id: c.id, keys: c.keys.slice(0, need) });
			overflow.push({ id: c.id, keys: c.keys.slice(need) });
			visibleCount += need;
		}
	}

	const byPriority = (a: RenderGroup, b: RenderGroup) => (prio.get(b.id) ?? -Infinity) - (prio.get(a.id) ?? -Infinity);
	visible.sort(byPriority);
	overflow.sort(byPriority);

	return { visible, overflow };
}
