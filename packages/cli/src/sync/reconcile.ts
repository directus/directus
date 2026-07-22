import { CliError } from '../kernel/error.js';
import { byCodepoint } from './codepoint.js';
import { SYSTEM_FK_FIELDS } from './fk-map.js';

// These fields identify the same system record across instances with different primary keys. Settings is
// a singleton, so its empty key matches a lone source and target but remains ambiguous for duplicates.
const NATURAL_KEYS: Readonly<Record<string, readonly string[]>> = {
	directus_roles: ['name'],
	directus_policies: ['name'],
	directus_flows: ['name'],
	directus_dashboards: ['name'],
	directus_operations: ['flow', 'key'],
	directus_permissions: ['policy', 'collection', 'action'],
	directus_access: ['role', 'user', 'policy'],
	directus_translations: ['language', 'key'],
	directus_users: ['email'],
	directus_settings: [],
};

/**
 * Whether a collection has a stable cross-instance natural key. Panels intentionally do not.
 */
export function hasNaturalKey(collection: string): boolean {
	return Object.hasOwn(NATURAL_KEYS, collection);
}

/** Source and target records for one collection reconciliation. */
export interface ReconcileInput {
	readonly collection: string;
	readonly primaryKey: string;
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

// Null is a real key component; a non-null source FK with no target mapping makes the whole key unusable.
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

// Group target rows by natural key, skipping any target already claimed (by the committed map or an
// earlier match) so a claimed record can never be offered as a candidate a second time.
function groupTargets(
	input: ReconcileInput,
	naturalKey: readonly string[],
	references: ReadonlyMap<string, string>,
	claimed: ReadonlySet<string>,
): Map<string, string[]> {
	const byKey = new Map<string, string[]>();

	for (const record of input.targetRecords) {
		const targetId = String(record[input.primaryKey]);

		if (claimed.has(targetId)) continue;

		const components = keyComponents(record, naturalKey, references, (_referenced, id) => id);
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
	const naturalKey = NATURAL_KEYS[input.collection];

	if (naturalKey === undefined) {
		throw new CliError('STATE', `No natural key defined for collection "${input.collection}".`, {
			hint: 'The reconcile table is out of date with the synced collection set.',
		});
	}

	const references = new Map<string, string>();

	for (const fk of SYSTEM_FK_FIELDS[input.collection] ?? []) {
		references.set(fk.field, fk.references);
	}

	const collectionProgress = progress.get(input.collection) ?? new Map<string, string>();
	const collectionClaimed = claimed.get(input.collection) ?? new Set<string>();

	if (!progress.has(input.collection)) progress.set(input.collection, collectionProgress);

	if (!claimed.has(input.collection)) claimed.set(input.collection, collectionClaimed);

	const targetsByKey = groupTargets(input, naturalKey, references, collectionClaimed);
	const existingBucket = existing[input.collection] ?? {};
	const sourcesByKey = new Map<string, string[]>();
	const unmatched: string[] = [];

	for (const record of input.sourceRecords) {
		const sourceId = String(record[input.primaryKey]);

		// The committed map wins: a source already mapped is skipped entirely, landing in no result bucket.
		if (Object.hasOwn(existingBucket, sourceId)) continue;

		const components = keyComponents(record, naturalKey, references, (referenced, id) => {
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

				// Commit immediately so a later collection's FK translation sees this pair, and so the target
				// is claimed and can never be matched again.
				collectionProgress.set(sourceId, targetId);
				collectionClaimed.add(targetId);
			}

			continue;
		}

		// Never guess among duplicate natural keys; a wrong identity can corrupt import or mirror deletion.
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
	// Normalize IDs to strings so numeric primary keys match persisted map keys.
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
