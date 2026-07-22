import { byCodepoint } from './codepoint.js';
import type { DiffOp, DiffRelationEntry, ImportBatchResult, SchemaDiff } from './contract.js';

/** Counts and deterministic terminal lines for a schema diff. */
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

/** Summarize a schema diff for deterministic terminal output. */
export function summarizeDiff(diff: SchemaDiff | null): DiffSummary {
	// Normalize the server's no-change response to the same summary shape.
	if (diff === null) return { added: 0, modified: 0, deleted: 0, lines: [] };

	// Preserve group order and sort within each group for deterministic output.
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

// Preserve first-seen wire order while removing duplicate paths.
function changedPaths(ops: DiffOp[]): string[] {
	const seen = new Set<string>();

	for (const op of ops) {
		if (op.path === undefined || op.path.length === 0) continue;
		seen.add(op.path.join('.'));
	}

	return [...seen];
}

function nameRelation(entry: DiffRelationEntry): string {
	const target = entry.related_collection === null ? '' : ` → ${entry.related_collection}`;
	return `relation ${entry.collection}.${entry.field}${target}`;
}

function renderLine(item: RenderItem): string {
	const token = KIND_TOKENS[item.change].padEnd(TOKEN_WIDTH);
	const paths = item.paths.length > 0 ? ` (${item.paths.join(', ')})` : '';
	return `${token}  ${item.name}${paths}`;
}

/** Counts and deterministic terminal lines for a data import. */
export interface ImportSummary {
	readonly created: number;
	readonly updated: number;
	readonly deleted: number;
	readonly lines: string[];
}

// Keep destructive plans recognizable without flooding the terminal.
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

/**
 * Return an explicit zero summary when no import request was needed.
 */
export function emptyImportSummary(): ImportSummary {
	return { created: 0, updated: 0, deleted: 0, lines: ['no data changes'] };
}

/**
 * Whether an import summary contains any created, updated, or deleted rows.
 */
export function hasImportChanges(summary: ImportSummary): boolean {
	return summary.created > 0 || summary.updated > 0 || summary.deleted > 0;
}

/** Summarize an import response, subtracting rows known to have been unchanged. */
export function summarizeImport(
	result: ImportBatchResult,
	unchanged?: ReadonlyMap<string, ReadonlySet<string>>,
): ImportSummary {
	let created = 0;
	let updated = 0;
	let deleted = 0;
	const lines: string[] = [];

	// Server response object order must not affect terminal output.
	for (const name of Object.keys(result.collections).sort(byCodepoint)) {
		const collection = result.collections[name];
		if (collection === undefined) continue;

		// The server reports every PK-present row as `existing` whether or not anything differed; the
		// caller's client-side unchanged set is what turns that into an honest "updated" count. Rows a
		// mirror batch carried only to survive the delete are not updates.
		const unchangedSet = unchanged?.get(name);

		const collectionCreated = collection.new.length;

		const collectionUpdated = collection.existing.filter((pk) => !(unchangedSet?.has(String(pk)) ?? false)).length;

		const collectionDeleted = collection.deleted.length;

		created += collectionCreated;
		updated += collectionUpdated;
		deleted += collectionDeleted;

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

	// Never leave a rendered data section blank and ambiguous.
	if (lines.length === 0) lines.push('no data changes');

	return { created, updated, deleted, lines };
}
