import { byCodepoint } from './codepoint.js';
import type { DiffOp, DiffRelationEntry, ImportBatchResult, SchemaDiff } from './contract.js';

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

export function summarizeDiff(diff: SchemaDiff | null): DiffSummary {
	// A null diff is the server's "schema already matches" answer; the zero summary lets both commands
	// treat "no schema change" and a genuinely empty diff through one shape, killing the duplicated
	// { added: 0, … } literal and its cast at the call sites.
	if (diff === null) return { added: 0, modified: 0, deleted: 0, lines: [] };

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

// Pure renderer for the data plan the dry-run (or real import) returns: per-collection created/updated/
// deleted counts, with the deleted PKs named so a destructive plan is legible before it is approved. The
// server's response keys are existing (rows the import matched and updated), new (inserted), and deleted
// (removed under mirror). No I/O — the caller prints `lines`, the counts feed the deletion gate.

export interface ImportSummary {
	readonly created: number;
	readonly updated: number;
	readonly deleted: number;
	readonly lines: string[];
}

// How many deleted PKs to spell out before eliding: enough to recognize a small destructive plan, capped
// so a large one does not flood the terminal. The elision is a literal '…', never a count.
const MAX_SHOWN_DELETED = 5;

function renderImportLine(
	name: string,
	created: number,
	updated: number,
	deleted: number,
	deletedIds: string[],
): string {
	const shown = deletedIds.slice(0, MAX_SHOWN_DELETED).join(', ');
	const ellipsis = deletedIds.length > MAX_SHOWN_DELETED ? ', …' : '';
	const deletedDetail = deleted > 0 ? ` (${shown}${ellipsis})` : '';
	return `~ ${name}  +${created} new  ~${updated} updated  ✖${deleted} deleted${deletedDetail}`;
}

export function summarizeImport(result: ImportBatchResult): ImportSummary {
	let created = 0;
	let updated = 0;
	let deleted = 0;
	const lines: string[] = [];

	// Codepoint-sorted collection order so the plan is byte-identical run to run regardless of how the
	// server keyed its response object.
	for (const name of Object.keys(result.collections).sort(byCodepoint)) {
		const collection = result.collections[name];
		if (collection === undefined) continue;

		const collectionCreated = collection.new.length;
		const collectionUpdated = collection.existing.length;
		const collectionDeleted = collection.deleted.length;

		created += collectionCreated;
		updated += collectionUpdated;
		deleted += collectionDeleted;

		// An all-zero collection is a no-op line the reader does not need — every committed collection ships
		// in the batch for uniformity, but only the ones that actually change earn a line.
		if (collectionCreated === 0 && collectionUpdated === 0 && collectionDeleted === 0) continue;

		lines.push(
			renderImportLine(
				name,
				collectionCreated,
				collectionUpdated,
				collectionDeleted,
				collection.deleted.map((id) => String(id)),
			),
		);
	}

	// A wholly-zero plan states so explicitly rather than rendering nothing, so the combined push plan
	// never leaves the data section blank and ambiguous.
	if (lines.length === 0) lines.push('no data changes');

	return { created, updated, deleted, lines };
}
