import { select } from '@clack/prompts';
import { isEqual } from 'lodash-es';
import type { SyncMode } from '../../../kernel/config/mode.js';
import { fetchQueryLimitMax } from '../../../kernel/connection.js';
import { CliError } from '../../../kernel/error.js';
import { ask } from '../../../kernel/prompt.js';
import type { CliContext } from '../../../kernel/run.js';
import { fetchRecords } from './api.js';
import { byCodepoint } from './codepoint.js';
import type { ImportCollectionData } from './contract.js';
import { type DataCollection, readDataFiles } from './data-store.js';
import { type IdMap, mappingsFor, normalizeInstanceUrl, readIdMap, withMappings, writeIdMap } from './id-map.js';
import { type CollectionReconcile, reconcileCollections, type ReconcileInput } from './reconcile.js';
import type { Target } from './resolve-target.js';
import { allResources, type Resource } from './resources.js';

/**
 * A source ID and the primary key sent for it. A null sent PK means the server assigned an ID that its
 * import response cannot report, so the next push must reconcile it by natural key.
 */
interface SentRecord {
	readonly sourceId: string;
	readonly sentPk: string | null;
}

interface SystemSent {
	readonly collection: string;
	readonly records: readonly SentRecord[];
}

/**
 * Target records whose synced fields already match. The server reports every PK-present record as `existing`,
 * so this set distinguishes actual updates from records sent only to survive mirror deletion.
 */
export type UnchangedRows = ReadonlyMap<string, ReadonlySet<string>>;

/** A prepared data import and the identity state needed to process its response. */
export interface DataPushPlan {
	readonly source: string;
	readonly target: string;
	readonly idMapPath: string;
	readonly map: IdMap;
	readonly batch: ImportCollectionData[];
	readonly systemSent: readonly SystemSent[];
	readonly unchanged: UnchangedRows;
	readonly records: number;
	readonly collections: number;
	/** Collections the stored metadata marks as truncated at pull time; mirror must refuse them. */
	readonly incomplete: readonly string[];
}

interface SystemCollection {
	readonly data: DataCollection;
	readonly resource: Resource;
}

/**
 * Partition stored collections into known system resources and user content. System resources follow
 * graph order; content collections are codepoint-sorted.
 */
export function partitionCollections(collections: readonly DataCollection[]): {
	system: SystemCollection[];
	content: DataCollection[];
} {
	const byCollection = new Map(collections.map((collection) => [collection.collection, collection]));
	const system: SystemCollection[] = [];
	const claimed = new Set<string>();

	for (const resource of allResources()) {
		const data = byCollection.get(resource.collection);

		if (data !== undefined) {
			// A hand-edited key could make validation and import disagree about record identity.
			if (data.primaryKey !== resource.primaryKey) {
				throw new CliError(
					'STATE',
					`The commit-ready file for ${data.collection} declares primary key "${data.primaryKey}", but this collection's primary key is "${resource.primaryKey}".`,
					{ hint: 'Fix or delete the data file, then run d6s sync pull again.' },
				);
			}

			system.push({ data, resource });
			claimed.add(resource.collection);
		}
	}

	const content = collections
		.filter((collection) => !claimed.has(collection.collection))
		.sort((a, b) => byCodepoint(a.collection, b.collection));

	return { system, content };
}

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

// Reconcile parents first so child natural keys can translate foreign keys through earlier matches.
// Fetch every target collection because add-mode identity checks also cover resources without natural keys.
async function reconcileSystem(
	system: readonly SystemCollection[],
	target: Target,
	existing: Readonly<Record<string, Readonly<Record<string, string>>>>,
	queryMax: number | undefined,
): Promise<{
	inputs: ReconcileInput[];
	results: CollectionReconcile[];
	targets: Map<string, readonly Record<string, unknown>[]>;
}> {
	const inputs: ReconcileInput[] = [];
	const targets = new Map<string, readonly Record<string, unknown>[]>();

	for (const { data, resource } of [...system].reverse()) {
		const targetRecords = await fetchRecords(target.credential, resource, queryMax);

		targets.set(resource.collection, targetRecords);

		if (resource.naturalKey === undefined) continue;

		inputs.push({
			collection: resource.collection,
			primaryKey: resource.primaryKey,
			naturalKey: resource.naturalKey,
			fkFields: resource.fkFields,
			sourceRecords: data.records,
			targetRecords,
		});
	}

	return { inputs, results: reconcileCollections(inputs, existing), targets };
}

const TARGET_PREFIX = 'target:';

function scalar(value: unknown): string | undefined {
	let rendered: string | undefined;

	if (typeof value === 'string') rendered = value === '' ? undefined : JSON.stringify(value);
	if (typeof value === 'number' || typeof value === 'boolean' || value === null) rendered = String(value);
	if (rendered === undefined) return undefined;

	return rendered.length > 60 ? `${rendered.slice(0, 59)}…` : rendered;
}

function recordLabel(record: Record<string, unknown> | undefined, primaryKey: string, fallbackId: string): string {
	if (record === undefined) return fallbackId;

	for (const field of ['name', 'email', 'key', 'title', 'collection', 'action']) {
		const value = scalar(record[field]);
		if (value !== undefined) return `${value} — ${String(record[primaryKey] ?? fallbackId)}`;
	}

	return String(record[primaryKey] ?? fallbackId);
}

function differenceHint(
	source: Record<string, unknown> | undefined,
	target: Record<string, unknown> | undefined,
	primaryKey: string,
): string {
	if (source === undefined || target === undefined) return 'Uses this existing target record';

	const differences: string[] = [];

	for (const field of [...new Set([...Object.keys(source), ...Object.keys(target)])].sort(byCodepoint)) {
		if (field === primaryKey || isEqual(source[field], target[field])) continue;

		const before = scalar(source[field]);
		const after = scalar(target[field]);

		differences.push(
			before === undefined || after === undefined
				? `${field}: values differ`
				: `${field}: source ${before}, target ${after}`,
		);
	}

	if (differences.length === 0) return 'Same synced values as source; only the ID differs';

	const shown = differences.slice(0, 2).join('; ');
	return differences.length > 2 ? `${shown}; +${differences.length - 2} more differences` : shown;
}

function matchedEntries(result: CollectionReconcile): Record<string, string> {
	const entries: Record<string, string> = {};
	for (const match of result.matched) entries[match.sourceId] = match.targetId;
	return entries;
}

interface ResolvedMatches {
	readonly seeds: ReadonlyMap<string, Record<string, string>>;
	readonly decided: readonly { collection: string; sourceId: string }[];
	readonly resolvedExisting: boolean;
}

async function resolveMatches(
	results: readonly CollectionReconcile[],
	inputs: readonly ReconcileInput[],
	ctx: CliContext,
): Promise<ResolvedMatches> {
	const seeds = new Map<string, Record<string, string>>();

	for (const result of results) {
		if (result.matched.length === 0) continue;
		seeds.set(result.collection, matchedEntries(result));
	}

	const ambiguities = results.flatMap((result) =>
		result.ambiguous.map((item) => ({ collection: result.collection, ...item })),
	);

	if (ambiguities.length === 0) return { seeds, decided: [], resolvedExisting: false };

	if (!ctx.interactive) {
		const lines = ambiguities.map((item) => {
			const input = inputs.find((candidate) => candidate.collection === item.collection);
			const source = input?.sourceRecords.find((record) => String(record[input.primaryKey]) === item.sourceId);
			const label = recordLabel(source, input?.primaryKey ?? 'id', item.sourceId);
			return `${item.collection} source ${label} → one of ${item.targetIds.join(', ')}`;
		});

		throw new CliError('STATE', `Ambiguous target matches:\n  ${lines.join('\n  ')}`, {
			hint: 'Run d6s sync push interactively once to choose, then commit the updated ID map.',
		});
	}

	const decided: { collection: string; sourceId: string }[] = [];
	let resolvedExisting = false;

	// A target can represent only one source.
	const taken = new Map<string, Set<string>>();

	for (const [index, item] of ambiguities.entries()) {
		const claimed = taken.get(item.collection) ?? new Set<string>();
		const input = inputs.find((candidate) => candidate.collection === item.collection);
		const primaryKey = input?.primaryKey ?? 'id';
		const source = input?.sourceRecords.find((record) => String(record[primaryKey]) === item.sourceId);

		const options: { value: string; label: string; hint: string }[] = [
			...item.targetIds
				.filter((id) => !claimed.has(id))
				.map((id) => {
					const target = input?.targetRecords.find((record) => String(record[primaryKey]) === id);
					return {
						value: `${TARGET_PREFIX}${id}`,
						label: `Use ${recordLabel(target, primaryKey, id)}`,
						hint: differenceHint(source, target, primaryKey),
					};
				}),
			{
				value: 'create',
				label: 'Create a separate record',
				hint: 'Adds one record; leaves every existing match unchanged',
			},
			{ value: 'abort', label: 'Abort the push', hint: 'Applies no remote changes' },
		];

		const choice = await ask(
			select({
				message: `Resolve identity ${index + 1} of ${ambiguities.length}: ${item.collection} source ${recordLabel(source, primaryKey, item.sourceId)} matches multiple target records`,
				options,
			}),
		);

		if (choice === 'abort') throw new CliError('STATE', 'Push aborted.');

		decided.push({ collection: item.collection, sourceId: item.sourceId });

		if (choice.startsWith(TARGET_PREFIX)) {
			const targetId = choice.slice(TARGET_PREFIX.length);
			claimed.add(targetId);
			taken.set(item.collection, claimed);

			const entries = seeds.get(item.collection) ?? {};
			entries[item.sourceId] = targetId;
			seeds.set(item.collection, entries);
			resolvedExisting = true;
		}
	}

	return { seeds, decided, resolvedExisting };
}

interface Reconciled {
	readonly source: string;
	readonly targetUrl: string;
	readonly system: readonly SystemCollection[];
	readonly map: IdMap;
	readonly incomplete: readonly string[];
	readonly inputs: readonly ReconcileInput[];
	readonly results: readonly CollectionReconcile[];
	readonly targets: ReadonlyMap<string, readonly Record<string, unknown>[]>;
}

async function readAndReconcile(target: Target): Promise<Reconciled | undefined> {
	const committed = readDataFiles(target.dataDir);

	if (committed === undefined) return undefined;

	const { source, collections, incomplete } = committed;

	if (collections.length === 0) return undefined;

	const targetUrl = normalizeInstanceUrl(target.url);
	const { system, content } = partitionCollections(collections);

	const unknownSystem = content.filter((data) => data.collection.startsWith('directus_'));

	if (unknownSystem.length > 0) {
		throw new CliError(
			'STATE',
			`The commit-ready files contain system collections this CLI version does not sync: ${unknownSystem.map((data) => data.collection).join(', ')}.`,
			{ hint: 'Delete those files and re-pull, or use a CLI version that syncs them.' },
		);
	}

	if (content.length > 0) {
		throw new CliError(
			'STATE',
			`The commit-ready files contain content collections: ${content.map((data) => data.collection).join(', ')}.`,
			{
				hint: 'Content sync is deferred in this release — the CLI syncs schema and configuration only. Delete those files and re-pull.',
			},
		);
	}

	const map = readIdMap(target.idMapPath);

	// One best-effort limit read can remove an exhaustion probe from every collection fetch.
	const queryMax = await fetchQueryLimitMax(target.credential);

	const { inputs, results, targets } = await reconcileSystem(
		system,
		target,
		mappingsFor(map, source, targetUrl),
		queryMax,
	);

	return { source, targetUrl, system, map, incomplete, inputs, results, targets };
}

// Target-only defaults and audit columns are outside the sync claim; the map already establishes identity.
function fieldsEqual(payload: Record<string, unknown>, target: Record<string, unknown>, pkField: string): boolean {
	for (const [key, value] of Object.entries(payload)) {
		if (key === pkField) continue;
		if (!isEqual(value, target[key])) return false;
	}

	return true;
}

// Batch identity rules prevent add-mode duplicates, numeric-PK collisions, and mirror deletion of local grants.
function assembleBatch(
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
			if (mode === 'add' && result.sent.sentPk !== null && targetByPk.has(result.sent.sentPk)) continue;

			// Never treat an unmatched source integer as target identity; hidden or same-batch records may own it.
			// The server assigns a fresh key instead, which a later natural-key reconciliation discovers safely:
			// the catalog admits no integer-PK resource without a natural key, so the record stays identifiable.
			if (mode !== 'add' && !mapped && resource.primaryKeyType === 'integer') {
				delete result.record[resource.primaryKey];
				items.push(result.record);
				sent.push({ sourceId, sentPk: null });
				continue;
			}

			if (mapped && result.sent.sentPk !== null) {
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

/**
 * Reconcile system identities, persist resolved matches, and prepare the import batch. An existing-target
 * ambiguity answer reruns reconciliation so newly translatable child keys do not import as duplicates.
 */
export async function prepareDataPush(
	target: Target,
	mode: SyncMode,
	ctx: CliContext,
): Promise<DataPushPlan | undefined> {
	const reconciled = await readAndReconcile(target);

	if (reconciled === undefined) return undefined;

	const { source, targetUrl, system, inputs, targets } = reconciled;

	// Persist identity decisions even if a later gate aborts, then retry child reconciliation in memory.
	let map = reconciled.map;
	let results = reconciled.results;
	const decided = new Map<string, Set<string>>();

	while (true) {
		const resolved = await resolveMatches(results, inputs, ctx);

		for (const item of resolved.decided) {
			const settled = decided.get(item.collection) ?? new Set<string>();
			settled.add(item.sourceId);
			decided.set(item.collection, settled);
		}

		for (const [collection, entries] of resolved.seeds) {
			map = withMappings(map, source, targetUrl, collection, entries);
		}

		if (!resolved.resolvedExisting) break;

		const remaining = inputs.map((input) => ({
			...input,
			sourceRecords: input.sourceRecords.filter(
				(record) => !decided.get(input.collection)?.has(String(record[input.primaryKey])),
			),
		}));

		results = reconcileCollections(remaining, mappingsFor(map, source, targetUrl));
	}

	if (map !== reconciled.map) writeIdMap(target.idMapPath, map);

	const { batch, systemSent, unchanged, records } = assembleBatch(
		system,
		mappingsFor(map, source, targetUrl),
		mode,
		targets,
	);

	return {
		source,
		target: targetUrl,
		idMapPath: target.idMapPath,
		map,
		batch,
		systemSent,
		unchanged,
		records,
		collections: batch.length,
		incomplete: reconciled.incomplete,
	};
}

/** A preview of the data phase: the batch a push would send, plus its reconcile tallies. */
export interface DataPreviewPlan {
	readonly source: string;
	readonly batch: ImportCollectionData[];
	readonly unchanged: UnchangedRows;
	readonly records: number;
	readonly matchedCount: number;
	readonly ambiguousCount: number;
	readonly unmatchedCount: number;
	readonly unchangedCount: number;
	readonly incomplete: readonly string[];
}

/**
 * Preview without prompting or writing. Unambiguous matches are applied in memory; ambiguous sources —
 * and every record whose FK chain leads to one — are excluded from the batch and surfaced only through
 * ambiguousCount: an interactive push resolves them (possibly into updates) and a non-interactive push
 * refuses until they are resolved.
 */
export async function previewData(target: Target, mode: SyncMode): Promise<DataPreviewPlan | undefined> {
	const reconciled = await readAndReconcile(target);

	if (reconciled === undefined) return undefined;

	const { source, targetUrl, system, results, targets } = reconciled;

	// Diff may use unambiguous matches in memory but never persist identity choices.
	let map = reconciled.map;
	const excluded = new Map<string, Set<string>>();

	for (const result of results) {
		if (result.ambiguous.length > 0) {
			excluded.set(result.collection, new Set(result.ambiguous.map((entry) => entry.sourceId)));
		}

		if (result.matched.length === 0) continue;

		map = withMappings(map, source, targetUrl, result.collection, matchedEntries(result));
	}

	// Ambiguous records are neither creates nor updates, so exclude and report them separately.
	// Exclude dependents whose foreign keys would dangle, iterating to cover self-referential chains.
	for (let changed = true; changed; ) {
		changed = false;

		for (const { data, resource } of system) {
			const fks = resource.fkFields;

			if (fks.length === 0) continue;

			const dropped = excluded.get(resource.collection) ?? new Set<string>();

			for (const record of data.records) {
				if (dropped.has(String(record[resource.primaryKey]))) continue;

				for (const fk of fks) {
					const value = record[fk.field];

					if (value === null || value === undefined) continue;
					if (excluded.get(fk.references)?.has(String(value)) !== true) continue;

					dropped.add(String(record[resource.primaryKey]));
					excluded.set(resource.collection, dropped);
					changed = true;
					break;
				}
			}
		}
	}

	let matchedCount = 0;
	let ambiguousCount = 0;
	let unmatchedCount = 0;

	for (const result of results) {
		const dropped = excluded.get(result.collection);
		matchedCount += result.matched.filter((entry) => dropped?.has(entry.sourceId) !== true).length;
		unmatchedCount += result.unmatched.filter((sourceId) => dropped?.has(sourceId) !== true).length;
	}

	for (const dropped of excluded.values()) ambiguousCount += dropped.size;

	const previewSystem = system.map((entry) => {
		const dropped = excluded.get(entry.resource.collection);

		if (dropped === undefined) return entry;

		return {
			...entry,
			data: {
				...entry.data,
				records: entry.data.records.filter((record) => !dropped.has(String(record[entry.resource.primaryKey]))),
			},
		};
	});

	const { batch, unchanged, records } = assembleBatch(
		previewSystem,
		mappingsFor(map, source, targetUrl),
		mode,
		targets,
	);

	let unchangedCount = 0;
	for (const set of unchanged.values()) unchangedCount += set.size;

	return {
		source,
		batch,
		unchanged,
		records,
		matchedCount,
		ambiguousCount,
		unmatchedCount,
		unchangedCount,
		incomplete: reconciled.incomplete,
	};
}
