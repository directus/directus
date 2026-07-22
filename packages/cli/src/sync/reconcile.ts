import { CliError } from '../kernel/error.js';
import { SYSTEM_FK_FIELDS } from './fk-map.js';

// Natural-key matching that seeds the ID map before a first import: it lets merge-mode imports UPDATE an
// existing target record instead of duplicating it, and stops a mirror-mode delete from destroying a
// target record that merely carries a different primary key. Pure — the caller supplies source and target
// records and receives a report; prompting on ambiguity and persisting matches into the committed map are
// other slices.

// The natural key per system collection: the field set that identifies "the same record" across two
// instances that assigned it different primary keys. directus_settings is the singleton — an empty key
// makes every settings record hash to the same key, so a lone source and a lone target match
// unconditionally (and two on a side, which cannot legitimately happen, fall to ambiguous rather than to a
// guess). A collection absent from this table is drift and must fail loud, never be silently unmatchable.
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
 * Whether a collection can be reconciled at all: exactly the collections given a natural key above. The
 * import slice consults this to pass reconcile only what it can match — a synced system collection with
 * no natural key (directus_panels: identified solely by its dashboard FK, no stable cross-instance key)
 * is remapped in place but never reconciled, and content is neither. Keeps NATURAL_KEYS private while
 * letting a caller avoid the by-design STATE throw on an unkeyed collection.
 */
export function hasNaturalKey(collection: string): boolean {
	return Object.hasOwn(NATURAL_KEYS, collection);
}

export interface ReconcileInput {
	readonly collection: string;
	readonly primaryKey: string;
	readonly sourceRecords: readonly Record<string, unknown>[];
	readonly targetRecords: readonly Record<string, unknown>[];
}

export interface CollectionReconcile {
	readonly collection: string;
	readonly matched: readonly { sourceId: string; targetId: string; key: string }[];
	readonly ambiguous: readonly { sourceId: string; key: string; targetIds: readonly string[] }[];
	readonly unmatched: readonly string[];
}

// Codepoint comparison, never localeCompare/Intl: locale ordering varies by machine and would make the
// seeded map — and every diff derived from it — non-deterministic across contributors and CI.
function byCodepoint(a: string, b: string): number {
	if (a < b) return -1;
	if (a > b) return 1;
	return 0;
}

// A source FK component whose referenced parent has not matched in this run. The row cannot equal any
// target row — its parent has no target-space ID yet — so the whole record is unmatched.
const UNTRANSLATABLE: unique symbol = Symbol('untranslatable');

// The ordered key components for one record. FK components (fields referencing another synced collection)
// are resolved through `resolveFk`: identity for target rows, whose values are already target-space, and a
// translation through the in-progress map for source rows. A null/undefined FK stays null and is a
// legitimate component — an access row with role set and user null must never collide with role null and
// user set. Returns null when a source FK is non-null but untranslatable.
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

		// A target FK resolves to itself: its stored value is already the target-space ID.
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

			// Both groups hold exactly one member, so both are defined; the guard proves it to the checker.
			if (sourceId !== undefined && targetId !== undefined) {
				matched.push({ sourceId, targetId, key });

				// Commit immediately so a later collection's FK translation sees this pair, and so the target
				// is claimed and can never be matched again.
				collectionProgress.set(sourceId, targetId);
				collectionClaimed.add(targetId);
			}

			continue;
		}

		// More than one source OR more than one target sharing a key: every involved source is ambiguous
		// against all candidate targets. Never guess — a wrong seed silently corrupts a later import or a
		// mirror delete.
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
 * Reconcile each collection in the given order — the caller passes parents before children so a child's FK
 * components can translate through matches already made this run. `existing` is the committed map's
 * collection→sourceId→targetId bucket (the shape id-map's mappingsFor returns); its source IDs are skipped
 * and its target IDs pre-claimed. The result array mirrors the input order; each collection's buckets are
 * codepoint-sorted so a reshuffled input yields byte-identical output.
 */
export function reconcileCollections(
	inputs: readonly ReconcileInput[],
	existing: Readonly<Record<string, Readonly<Record<string, string>>>>,
): CollectionReconcile[] {
	// The in-progress map: collection → (sourceId → targetId), seeded from the committed map and grown as
	// matches land, and the set of claimed target IDs per collection. Both are String()-normalized so an
	// integer primary key (settings id 1) compares as the same '1' whichever side it came from.
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
