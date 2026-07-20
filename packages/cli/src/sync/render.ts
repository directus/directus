import type { DiffOp, DiffRelationEntry, SchemaDiff } from './contract.js';

// Pure diff renderer: turns a SchemaDiff into a human summary the diff command prints and the
// push slice reuses. No I/O, no colour — the caller decides how to surface `lines`, and the
// counts drive gating. Classification and ordering key off the validated addressing keys and op
// kinds; everything else on an op stays opaque.

export interface DiffSummary {
	readonly added: number;
	readonly modified: number;
	readonly deleted: number;
	readonly lines: string[];
}

type Change = 'added' | 'modified' | 'deleted';

// A deletion carries a loud token so the operator's eye snags on it before approving a push.
const KIND_TOKENS: Record<Change, string> = { added: '+', modified: '~', deleted: '✖ DELETE' };
const TOKEN_WIDTH = Math.max(...Object.values(KIND_TOKENS).map((token) => token.length));

interface RenderItem {
	name: string;
	change: Change;
	paths: string[];
}

export function summarizeDiff(diff: SchemaDiff): DiffSummary {
	// Grouped collections → fields → systemFields → relations; each group codepoint-sorted by
	// rendered name so the output is byte-identical run to run.
	const items: RenderItem[] = [
		...toItems(diff.collections, (item) => `collection ${item.collection}`),
		...toItems(diff.fields, (item) => `field ${item.collection}.${item.field}`),
		...toItems(diff.systemFields, (item) => `system field ${item.collection}.${item.field}`),
		...toItems(diff.relations, nameRelation),
	];

	let added = 0;
	let modified = 0;
	let deleted = 0;
	const lines: string[] = [];

	// Counts are per changed item, never per op: one edited field with three ops is one modification.
	for (const item of items) {
		if (item.change === 'added') added++;
		else if (item.change === 'deleted') deleted++;
		else modified++;

		lines.push(renderLine(item));
	}

	return { added, modified, deleted, lines };
}

function toItems<T extends { diff: DiffOp[] }>(entries: T[], name: (entry: T) => string): RenderItem[] {
	return entries
		.map((entry) => {
			const change = classify(entry.diff);
			// Only modifications name their touched paths; an add/delete is the whole item.
			return { name: name(entry), change, paths: change === 'modified' ? changedPaths(entry.diff) : [] };
		})
		.sort((a, b) => byCodepoint(a.name, b.name));
}

// A root op (no path) with kind N adds the item and kind D deletes it; anything else — a keyed
// edit, an array op, a nested add/delete — is a modification of an existing item.
function classify(ops: DiffOp[]): Change {
	if (ops.some((op) => op.kind === 'N' && isRoot(op))) return 'added';
	if (ops.some((op) => op.kind === 'D' && isRoot(op))) return 'deleted';
	return 'modified';
}

function isRoot(op: DiffOp): boolean {
	return op.path === undefined || op.path.length === 0;
}

// Unique dot-joined paths in first-seen order — the wire diff order is deterministic, so no sort.
function changedPaths(ops: DiffOp[]): string[] {
	const seen = new Set<string>();

	for (const op of ops) {
		if (op.path === undefined || op.path.length === 0) continue;
		seen.add(op.path.join('.'));
	}

	return [...seen];
}

function nameRelation(entry: DiffRelationEntry): string {
	// A relation with no related_collection (e.g. an m2a) has no target to point at, so drop the arrow.
	const target = entry.related_collection === null ? '' : ` → ${entry.related_collection}`;
	return `relation ${entry.collection}.${entry.field}${target}`;
}

function renderLine(item: RenderItem): string {
	const token = KIND_TOKENS[item.change].padEnd(TOKEN_WIDTH);
	const paths = item.paths.length > 0 ? ` (${item.paths.join(', ')})` : '';
	return `${token}  ${item.name}${paths}`;
}

// Codepoint comparison, never localeCompare/Intl: locale ordering varies by machine and would make
// the rendered output non-deterministic across contributors and CI (same rule as the store).
function byCodepoint(a: string, b: string): number {
	if (a < b) return -1;
	if (a > b) return 1;
	return 0;
}
