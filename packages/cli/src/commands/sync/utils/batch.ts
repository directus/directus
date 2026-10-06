import { isEqual } from 'lodash-es';
import type { SyncMode } from '../../../kernel/config/mode.js';
import type { ImportCollectionData } from './contract.js';
import type { Resource } from './resources.js';
import type { SystemCollection } from './system-collections.js';

export interface SentRecord {
	readonly sourceId: string;
	readonly sentPk: string;
	/** `sentPk` is an invented key; only a `mapped` response entry can supply the real target ID. */
	readonly temporary?: true;
}

export interface SystemSent {
	readonly collection: string;
	readonly records: readonly SentRecord[];
}

/** Target records whose synced fields already match, keyed by collection. */
export type UnchangedRows = ReadonlyMap<string, ReadonlySet<string>>;

/** Does not mutate. A missing mapping or nullish foreign key is left for the server to resolve or reject. */
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

// Not lodash isMatch: its partial comparison calls a shrunken or reordered array a match.
function fieldsEqual(payload: Record<string, unknown>, target: Record<string, unknown>, pkField: string): boolean {
	for (const [key, value] of Object.entries(payload)) {
		if (key === pkField) continue;
		if (!isEqual(value, target[key])) return false;
	}

	return true;
}

/** Negative keys the import response can correlate back to source records. Only descends, so none repeats. */
function temporaryPkAllocator(reserved: ReadonlySet<string>): () => number {
	let next = -1;

	return () => {
		while (reserved.has(String(next))) next--;
		return next--;
	};
}

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

	function markUnchanged(collection: string, pk: string): void {
		const set = unchanged.get(collection) ?? new Set<string>();
		set.add(pk);
		unchanged.set(collection, set);
	}

	// Preserving a user-attached grant is empty if its policy dies: directus_access.policy cascades on
	// delete, so a target-only policy those grants reference must ride the keep set too, with its
	// permission rules. Policies the sync files already map need no echo — the batch keeps them itself.
	const echoPolicyIds = new Set<string>();

	if (mode === 'mirror' && !includesUsers) {
		for (const row of targets.get('directus_access') ?? []) {
			if (row['user'] !== null && row['user'] !== undefined && row['policy'] !== null && row['policy'] !== undefined) {
				echoPolicyIds.add(String(row['policy']));
			}
		}

		const policies = system.find((entry) => entry.resource.collection === 'directus_policies');

		for (const record of policies?.data.records ?? []) {
			const mappedPk = bucket['directus_policies']?.[String(record[policies!.resource.primaryKey])];
			if (mappedPk !== undefined) echoPolicyIds.delete(mappedPk);
		}
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

			// An unmatched integer may belong to an unrelated target record, or to one created earlier in this
			// batch, so a temporary key is sent instead. A singleton drops its key: it cannot report a remap.
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

		if (mode === 'mirror' && !includesUsers) {
			const shouldEcho = (row: Record<string, unknown>): boolean => {
				if (resource.collection === 'directus_access') return row['user'] !== null && row['user'] !== undefined;
				if (resource.collection === 'directus_policies') return echoPolicyIds.has(String(row[resource.primaryKey]));
				if (resource.collection === 'directus_permissions') return echoPolicyIds.has(String(row['policy']));
				return false;
			};

			for (const row of targetRows ?? []) {
				if (shouldEcho(row)) {
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
