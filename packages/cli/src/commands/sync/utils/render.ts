import { maybePluralize } from '../../../kernel/text.js';
import { DELETED_MARK, KIND_TOKENS } from '../../../kernel/ui.js';
import { byCodepoint } from './codepoint.js';
import type { DiffOp, DiffRelationEntry, ImportBatchResult, SchemaDiff } from './contract.js';

interface DiffSummary {
	readonly added: number;
	readonly modified: number;
	readonly deleted: number;
	readonly lines: string[];
}

type Change = 'added' | 'modified' | 'deleted';

const TOKEN_WIDTH = Math.max(...Object.values(KIND_TOKENS).map((token) => token.length));

interface RenderItem {
	name: string;
	change: Change;
	paths: string[];
}

export function summarizeDiff(diff: SchemaDiff | null): DiffSummary {
	if (diff === null) return { added: 0, modified: 0, deleted: 0, lines: [] };

	// A collection added or deleted wholesale brings every field and relation with it, and listing each one
	// buries the signal, so those children collapse to a count on the collection's line. Counts still tally
	// per item, so the deletion gate and the --json report are unaffected.
	const wholesale = new Set<string>();

	for (const entry of diff.collections) {
		if (classify(entry.diff) !== 'modified') wholesale.add(entry.collection);
	}

	const rolled = new Map<string, { fields: number; relations: number }>();

	function keep<T extends { collection: string }>(entries: T[], kind: 'fields' | 'relations'): T[] {
		return entries.filter((entry) => {
			if (!wholesale.has(entry.collection)) return true;

			const counts = rolled.get(entry.collection) ?? { fields: 0, relations: 0 };
			counts[kind] += 1;
			rolled.set(entry.collection, counts);
			return false;
		});
	}

	const keptFields = keep(diff.fields, 'fields');
	const keptSystemFields = keep(diff.systemFields, 'fields');
	const keptRelations = keep(diff.relations, 'relations');

	function nameCollection(entry: { collection: string }): string {
		const counts = rolled.get(entry.collection);

		if (counts === undefined || (counts.fields === 0 && counts.relations === 0)) {
			return `collection ${entry.collection}`;
		}

		const parts: string[] = [];
		if (counts.fields > 0) parts.push(maybePluralize(counts.fields, 'field'));
		if (counts.relations > 0) parts.push(maybePluralize(counts.relations, 'relation'));

		return `collection ${entry.collection} (${parts.join(', ')})`;
	}

	const items: RenderItem[] = [
		...toItems(diff.collections, nameCollection),
		...toItems(keptFields, (item) => `field ${item.collection}.${item.field}`),
		...toItems(keptSystemFields, (item) => `system field ${item.collection}.${item.field}`),
		...toItems(keptRelations, relationLabel),
	];

	let added = 0;
	let modified = 0;
	let deleted = 0;

	// Counted per item, not per op or per line: a rolled-up child still counts though it has no line.
	for (const entry of [...diff.collections, ...diff.fields, ...diff.systemFields, ...diff.relations]) {
		const change = classify(entry.diff);

		if (change === 'added') added++;
		else if (change === 'deleted') deleted++;
		else modified++;
	}

	return { added, modified, deleted, lines: items.map((item) => formatLine(item)) };
}

function toItems<T extends { diff: DiffOp[] }>(entries: T[], name: (entry: T) => string): RenderItem[] {
	return entries
		.map((entry) => {
			const change = classify(entry.diff);
			return { name: name(entry), change, paths: change === 'modified' ? changedPaths(entry.diff) : [] };
		})
		.sort((a, b) => byCodepoint(a.name, b.name));
}

// Only a root op (no path) adds or deletes the item itself; anything nested modifies an existing item.
function classify(ops: DiffOp[]): Change {
	if (ops.some((op) => op.kind === 'N' && isRoot(op))) return 'added';
	if (ops.some((op) => op.kind === 'D' && isRoot(op))) return 'deleted';
	return 'modified';
}

function isRoot(op: DiffOp): boolean {
	return op.path === undefined || op.path.length === 0;
}

function changedPaths(ops: DiffOp[]): string[] {
	const seen = new Set<string>();

	for (const op of ops) {
		if (op.path === undefined || op.path.length === 0) continue;
		seen.add(op.path.join('.'));
	}

	return [...seen];
}

function relationLabel(entry: DiffRelationEntry): string {
	const target = entry.related_collection === null ? '' : ` → ${entry.related_collection}`;
	return `relation ${entry.collection}.${entry.field}${target}`;
}

function formatLine(item: RenderItem): string {
	const token = KIND_TOKENS[item.change].padEnd(TOKEN_WIDTH);
	const paths = item.paths.length > 0 ? ` (${item.paths.join(', ')})` : '';
	return `${token}  ${item.name}${paths}`;
}

export interface ImportSummary {
	readonly created: number;
	readonly updated: number;
	readonly deleted: number;
	readonly lines: string[];
}

const MAX_SHOWN_DELETED = 5;

function formatImportLine(
	name: string,
	created: number,
	updated: number,
	deleted: number,
	deletedIds: string[],
): string {
	const shown = deletedIds.slice(0, MAX_SHOWN_DELETED).join(', ');
	const ellipsis = deletedIds.length > MAX_SHOWN_DELETED ? ', …' : '';
	const deletedDetail = deleted > 0 ? ` (${shown}${ellipsis})` : '';
	return `~ ${name}  +${created} new  ~${updated} updated  ${DELETED_MARK}${deleted} deleted${deletedDetail}`;
}

/** For paths that send no import request but still owe the plan a summary. */
export function emptyImportSummary(): ImportSummary {
	return { created: 0, updated: 0, deleted: 0, lines: ['no data changes'] };
}

export function hasImportChanges(summary: ImportSummary): boolean {
	return summary.created > 0 || summary.updated > 0 || summary.deleted > 0;
}

export function summarizeImport(
	result: ImportBatchResult,
	unchanged?: ReadonlyMap<string, ReadonlySet<string>>,
): ImportSummary {
	let created = 0;
	let updated = 0;
	let deleted = 0;
	const lines: string[] = [];

	for (const name of Object.keys(result.collections).sort(byCodepoint)) {
		const collection = result.collections[name];
		if (collection === undefined) continue;

		// The server calls every PK-present record `existing` whether or not anything differed, so `unchanged`
		// is what turns that into an honest "updated" count.
		const unchangedSet = unchanged?.get(name);

		const collectionCreated = collection.new.length;

		const collectionUpdated = collection.existing.filter((pk) => !(unchangedSet?.has(String(pk)) ?? false)).length;

		const collectionDeleted = collection.deleted.length;

		created += collectionCreated;
		updated += collectionUpdated;
		deleted += collectionDeleted;

		if (collectionCreated === 0 && collectionUpdated === 0 && collectionDeleted === 0) continue;

		lines.push(
			formatImportLine(
				name,
				collectionCreated,
				collectionUpdated,
				collectionDeleted,
				collection.deleted.map((id) => String(id)),
			),
		);
	}

	if (lines.length === 0) lines.push('no data changes');

	return { created, updated, deleted, lines };
}
