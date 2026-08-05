import { byCodepoint } from './codepoint.js';
import type { FkField } from './resources.js';

/** Source and target records for one collection reconciliation, with the resource facts that identify them. */
export interface ReconcileInput {
	readonly collection: string;
	readonly primaryKey: string;
	/** The resource's natural key: the fields that identify the same record across instances. */
	readonly naturalKey: readonly string[];
	readonly fkFields: readonly FkField[];
	readonly sourceRecords: readonly Record<string, unknown>[];
	readonly targetRecords: readonly Record<string, unknown>[];
}

/** Matched, ambiguous, and unmatched source identities for one collection. */
export interface CollectionReconcile {
	readonly collection: string;
	readonly matched: readonly { sourceId: string; targetId: string; key: string }[];
	readonly ambiguous: readonly { sourceId: string; key: string; targetIds: readonly string[] }[];
	readonly unmatched: readonly string[];
}

const UNTRANSLATABLE: unique symbol = Symbol('untranslatable');

// Null is a real key component; an unmapped non-null foreign key makes the natural key unusable.
function keyComponents(
	record: Record<string, unknown>,
	naturalKey: readonly string[],
	references: ReadonlyMap<string, string>,
	resolveFk: (referenced: string, id: string) => string | typeof UNTRANSLATABLE,
): unknown[] | null {
	const components: unknown[] = [];

	for (const field of naturalKey) {
		const referenced = references.get(field);
		const raw = record[field];

		if (referenced === undefined) {
			components.push(raw === undefined ? null : raw);
			continue;
		}

		if (raw === null || raw === undefined) {
			components.push(null);
			continue;
		}

		const resolved = resolveFk(referenced, String(raw));

		if (resolved === UNTRANSLATABLE) return null;

		components.push(resolved);
	}

	return components;
}

// Never offer a target already claimed by the ID map or an earlier match.
function groupTargets(
	input: ReconcileInput,
	references: ReadonlyMap<string, string>,
	claimed: ReadonlySet<string>,
): Map<string, string[]> {
	const byKey = new Map<string, string[]>();

	for (const record of input.targetRecords) {
		const targetId = String(record[input.primaryKey]);

		if (claimed.has(targetId)) continue;

		const components = keyComponents(record, input.naturalKey, references, (_referenced, id) => id);
		const key = JSON.stringify(components);
		const bucket = byKey.get(key);

		if (bucket === undefined) {
			byKey.set(key, [targetId]);
		} else {
			bucket.push(targetId);
		}
	}

	return byKey;
}

function reconcileOne(
	input: ReconcileInput,
	existing: Readonly<Record<string, Readonly<Record<string, string>>>>,
	progress: Map<string, Map<string, string>>,
	claimed: Map<string, Set<string>>,
): CollectionReconcile {
	const references = new Map<string, string>();

	for (const fk of input.fkFields) {
		references.set(fk.field, fk.references);
	}

	const collectionProgress = progress.get(input.collection) ?? new Map<string, string>();
	const collectionClaimed = claimed.get(input.collection) ?? new Set<string>();

	if (!progress.has(input.collection)) progress.set(input.collection, collectionProgress);

	if (!claimed.has(input.collection)) claimed.set(input.collection, collectionClaimed);

	const targetsByKey = groupTargets(input, references, collectionClaimed);
	const existingBucket = existing[input.collection] ?? {};
	const sourcesByKey = new Map<string, string[]>();
	const unmatched: string[] = [];

	for (const record of input.sourceRecords) {
		const sourceId = String(record[input.primaryKey]);

		if (Object.hasOwn(existingBucket, sourceId)) continue;

		const components = keyComponents(record, input.naturalKey, references, (referenced, id) => {
			return progress.get(referenced)?.get(id) ?? UNTRANSLATABLE;
		});

		if (components === null) {
			unmatched.push(sourceId);
			continue;
		}

		const key = JSON.stringify(components);
		const bucket = sourcesByKey.get(key);

		if (bucket === undefined) {
			sourcesByKey.set(key, [sourceId]);
		} else {
			bucket.push(sourceId);
		}
	}

	const matched: { sourceId: string; targetId: string; key: string }[] = [];
	const ambiguous: { sourceId: string; key: string; targetIds: readonly string[] }[] = [];

	for (const [key, sourceIds] of sourcesByKey) {
		const targetIds = targetsByKey.get(key) ?? [];

		if (targetIds.length === 0) {
			for (const sourceId of sourceIds) unmatched.push(sourceId);
			continue;
		}

		if (sourceIds.length === 1 && targetIds.length === 1) {
			const [sourceId] = sourceIds;
			const [targetId] = targetIds;

			if (sourceId !== undefined && targetId !== undefined) {
				matched.push({ sourceId, targetId, key });

				// Later child keys need this mapping during the same reconciliation pass.
				collectionProgress.set(sourceId, targetId);
				collectionClaimed.add(targetId);
			}

			continue;
		}

		// Never guess among duplicate natural keys.
		const targetIdsSorted = [...targetIds].sort(byCodepoint);

		for (const sourceId of sourceIds) {
			ambiguous.push({ sourceId, key, targetIds: targetIdsSorted });
		}
	}

	matched.sort((a, b) => byCodepoint(a.sourceId, b.sourceId));
	ambiguous.sort((a, b) => byCodepoint(a.sourceId, b.sourceId));
	unmatched.sort(byCodepoint);

	return { collection: input.collection, matched, ambiguous, unmatched };
}

/**
 * Reconcile collections in parent-first order. Existing source IDs are skipped and their targets claimed;
 * new matches become available to later child FK keys.
 */
export function reconcileCollections(
	inputs: readonly ReconcileInput[],
	existing: Readonly<Record<string, Readonly<Record<string, string>>>>,
): CollectionReconcile[] {
	const progress = new Map<string, Map<string, string>>();
	const claimed = new Map<string, Set<string>>();

	for (const [collection, bucket] of Object.entries(existing)) {
		const map = new Map<string, string>();
		const taken = new Set<string>();

		for (const [sourceId, targetId] of Object.entries(bucket)) {
			map.set(String(sourceId), String(targetId));
			taken.add(String(targetId));
		}

		progress.set(collection, map);
		claimed.set(collection, taken);
	}

	const results: CollectionReconcile[] = [];

	for (const input of inputs) {
		results.push(reconcileOne(input, existing, progress, claimed));
	}

	return results;
}
