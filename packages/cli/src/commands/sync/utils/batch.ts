import { isEqual } from 'lodash-es';
import type { SyncMode } from '../../../kernel/config/mode.js';
import type { ImportCollectionData } from './contract.js';
import type { Resource } from './resources.js';
import type { SystemCollection } from './system-collections.js';

/** A source ID and the primary key sent for it. */
export interface SentRecord {
	readonly sourceId: string;
	readonly sentPk: string;
	/** The sent key is an invented temporary; only a `mapped` response entry can supply the real target ID. */
	readonly temporary?: true;
}

export interface SystemSent {
	readonly collection: string;
	readonly records: readonly SentRecord[];
}

/**
 * Target records whose synced fields already match. The server reports every PK-present record as `existing`,
 * so this set distinguishes actual updates from records sent only to survive mirror deletion.
 */
export type UnchangedRows = ReadonlyMap<string, ReadonlySet<string>>;

/**
 * Rewrite a system record into target ID space without mutating the input. Missing mappings and nullish
 * foreign keys remain unchanged; the server must resolve or reject them.
 */
export function remapSystemRecord(
	record: Record<string, unknown>,
	resource: Resource,
	bucket: Readonly<Record<string, Readonly<Record<string, string>>>>,
): { record: Record<string, unknown>; sent: SentRecord } {
	const remapped: Record<string, unknown> = { ...record };
	const sourceId = String(record[resource.primaryKey]);
	const targetPk = bucket[resource.collection]?.[sourceId];

	if (targetPk !== undefined) remapped[resource.primaryKey] = targetPk;

	for (const fk of resource.fkFields) {
		const value = record[fk.field];

		if (value === null || value === undefined) continue;

		const targetFk = bucket[fk.references]?.[String(value)];

		if (targetFk !== undefined) remapped[fk.field] = targetFk;
	}

	return { record: remapped, sent: { sourceId, sentPk: targetPk ?? sourceId } };
}

// Not lodash isMatch: its partial comparison calls a shrunken or reordered array field a match, which
// would report a changed record as unchanged and drop it from the batch.
function fieldsEqual(payload: Record<string, unknown>, target: Record<string, unknown>, pkField: string): boolean {
	for (const [key, value] of Object.entries(payload)) {
		if (key === pkField) continue;
		if (!isEqual(value, target[key])) return false;
	}

	return true;
}

/**
 * Hand out negative primary keys the import response can correlate back to their source records. Only
 * descends, so a key is never reissued; `reserved` keeps it clear of keys the source or target already uses.
 */
function temporaryPkAllocator(reserved: ReadonlySet<string>): () => number {
	let next = -1;

	return () => {
		while (reserved.has(String(next))) next--;
		return next--;
	};
}

// Batch identity rules prevent add-mode duplicates, numeric-PK collisions, and mirror deletion of local grants.
export function assembleBatch(
	system: readonly SystemCollection[],
	bucket: Readonly<Record<string, Readonly<Record<string, string>>>>,
	mode: SyncMode,
	targets: ReadonlyMap<string, readonly Record<string, unknown>[]>,
): { batch: ImportCollectionData[]; systemSent: SystemSent[]; unchanged: UnchangedRows; records: number } {
	const batch: ImportCollectionData[] = [];
	const systemSent: SystemSent[] = [];
	const unchanged = new Map<string, Set<string>>();
	let records = 0;

	const includesUsers = system.some((entry) => entry.resource.collection === 'directus_users');

	// Records the target already matches: the import reports every PK-present record as `existing`, so this set is
	// what keeps them out of the rendered "updated" count.
	function markUnchanged(collection: string, pk: string): void {
		const set = unchanged.get(collection) ?? new Set<string>();
		set.add(pk);
		unchanged.set(collection, set);
	}

	for (const { data, resource } of system) {
		const collectionBucket = bucket[resource.collection] ?? {};
		const targetRows = targets.get(resource.collection);
		const targetByPk = new Map((targetRows ?? []).map((row) => [String(row[resource.primaryKey]), row]));

		const takeTemporaryPk = temporaryPkAllocator(
			new Set([
				...targetByPk.keys(),
				...Object.values(collectionBucket),
				...data.records.map((record) => String(record[resource.primaryKey])),
			]),
		);

		const items: Record<string, unknown>[] = [];
		const sent: SentRecord[] = [];

		for (const record of data.records) {
			const sourceId = String(record[resource.primaryKey]);
			const mapped = Object.hasOwn(collectionBucket, sourceId);

			if (mode === 'add' && mapped) {
				// Re-send a mapped record deleted from the target; otherwise add mode could never restore it.
				const mappedPk = collectionBucket[sourceId];

				if (mappedPk === undefined || targetByPk.has(mappedPk)) continue;
			}

			const result = remapSystemRecord(record, resource, bucket);

			// Add-mode PK conflicts create duplicates instead of updating existing records.
			if (mode === 'add' && targetByPk.has(result.sent.sentPk)) continue;

			// An unmatched integer may belong to an unrelated target or a record created earlier in this batch.
			// Singletons cannot report a remap; otherwise a temporary negative key gives the response a safe correlation.
			if (mode !== 'add' && !mapped && resource.primaryKeyType === 'integer') {
				if (resource.singleton) {
					delete result.record[resource.primaryKey];
					items.push(result.record);
					continue;
				}

				const temporaryPk = takeTemporaryPk();
				result.record[resource.primaryKey] = temporaryPk;
				items.push(result.record);
				sent.push({ sourceId, sentPk: String(temporaryPk), temporary: true });
				continue;
			}

			if (mapped) {
				const targetRow = targetByPk.get(result.sent.sentPk);

				if (targetRow !== undefined && fieldsEqual(result.record, targetRow, resource.primaryKey)) {
					markUnchanged(resource.collection, result.sent.sentPk);

					// Mirror still sends the record: absence from the batch is the deletion order.
					if (mode !== 'mirror') continue;
				}
			}

			items.push(result.record);
			sent.push(result.sent);
		}

		if (mode === 'mirror' && resource.collection === 'directus_access' && !includesUsers) {
			for (const row of targetRows ?? []) {
				if (row['user'] !== null && row['user'] !== undefined) {
					items.push({ ...row });
					markUnchanged(resource.collection, String(row[resource.primaryKey]));
				}
			}
		}

		batch.push({ collection: resource.collection, items });
		systemSent.push({ collection: resource.collection, records: sent });
		records += items.length;
	}

	return { batch, systemSent, unchanged, records };
}
