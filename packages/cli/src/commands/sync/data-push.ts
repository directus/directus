import { select } from '@clack/prompts';
import { isEqual } from 'lodash-es';
import { CliError } from '../../kernel/error.js';
import { ask } from '../../kernel/prompt.js';
import type { CliContext } from '../../kernel/run.js';
import { fetchRecords } from '../../sync/api.js';
import { byCodepoint } from '../../sync/codepoint.js';
import type { ImportCollectionData } from '../../sync/contract.js';
import { type DataCollection, hasDataFiles, readDataFiles } from '../../sync/data-store.js';
import { SYSTEM_FK_FIELDS } from '../../sync/fk-map.js';
import {
	type IdMap,
	mappingsFor,
	normalizeInstanceUrl,
	readIdMap,
	withMappings,
	writeIdMap,
} from '../../sync/id-map.js';
import type { Mode } from '../../sync/mode.js';
import {
	type CollectionReconcile,
	hasNaturalKey,
	reconcileCollections,
	type ReconcileInput,
} from '../../sync/reconcile.js';
import { allResources, type Resource } from '../../sync/resources.js';
import type { Target } from './resolve-target.js';

/**
 * A source ID and the primary key sent for it. A null sent PK means the server assigned an ID that its
 * import response cannot report, so the next push must reconcile it by natural key.
 */
export interface SentRecord {
	readonly sourceId: string;
	readonly sentPk: string | null;
}

/** Records sent for one system collection, used to update the ID map after import. */
export interface SystemSent {
	readonly collection: string;
	readonly records: readonly SentRecord[];
}

/**
 * Target rows whose exported fields already match. The server reports every PK-present row as `existing`,
 * so this set distinguishes actual updates from rows sent only to survive mirror deletion.
 */
export type UnchangedRows = ReadonlyMap<string, ReadonlySet<string>>;

/** A prepared data import and the identity state needed to process its response. */
export interface DataPushPlan {
	readonly skipped: false;
	readonly source: string;
	readonly target: string;
	readonly idMapPath: string;
	readonly map: IdMap;
	readonly batch: ImportCollectionData[];
	readonly systemSent: readonly SystemSent[];
	readonly unchanged: UnchangedRows;
	readonly records: number;
	readonly collections: number;
}

/** A schema-only checkout with no committed data generation. */
export interface DataPushSkipped {
	readonly skipped: true;
}

export type DataPushResult = DataPushPlan | DataPushSkipped;

interface SystemCollection {
	readonly data: DataCollection;
	readonly resource: Resource;
}

/**
 * Partition committed collections into known system resources and user content. System resources follow
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
	collection: string,
	primaryKey: string,
	bucket: Readonly<Record<string, Readonly<Record<string, string>>>>,
): { record: Record<string, unknown>; sent: SentRecord } {
	const remapped: Record<string, unknown> = { ...record };
	const sourceId = String(record[primaryKey]);
	const targetPk = bucket[collection]?.[sourceId];

	if (targetPk !== undefined) remapped[primaryKey] = targetPk;

	for (const fk of SYSTEM_FK_FIELDS[collection] ?? []) {
		const value = record[fk.field];

		if (value === null || value === undefined) continue;

		const targetFk = bucket[fk.references]?.[String(value)];

		if (targetFk !== undefined) remapped[fk.field] = targetFk;
	}

	return { record: remapped, sent: { sourceId, sentPk: targetPk ?? sourceId } };
}

// Reconcile parents before children so FK components can be translated through matches made earlier in
// this run. Resource import order is children-first, so reconciliation consumes it in reverse.
//
// EVERY system target is fetched — not just the natural-keyed ones — because batch assembly needs to see
// which PKs exist on the target: the add-mode skips and the mapped-row self-heal read that set, and an
// unfetched collection (panels has no natural key) would read as "all rows missing", resending mapped
// rows that add-mode then duplicates under fresh UUIDs.
async function reconcileSystem(
	system: readonly SystemCollection[],
	target: Target,
	existing: Readonly<Record<string, Readonly<Record<string, string>>>>,
): Promise<{
	inputs: ReconcileInput[];
	results: CollectionReconcile[];
	targets: Map<string, readonly Record<string, unknown>[]>;
}> {
	const inputs: ReconcileInput[] = [];
	const targets = new Map<string, readonly Record<string, unknown>[]>();

	for (const { data, resource } of [...system].reverse()) {
		const targetRecords = await fetchRecords(target.credential, {
			collection: resource.collection,
			endpoint: resource.endpoint,
			primaryKey: resource.primaryKey,
			singleton: resource.singleton,
			drop: resource.drop,
		});

		targets.set(resource.collection, targetRecords);

		if (!hasNaturalKey(resource.collection)) continue;

		inputs.push({
			collection: resource.collection,
			primaryKey: resource.primaryKey,
			sourceRecords: data.records,
			targetRecords,
		});
	}

	// Keep the inputs so resolving a parent ambiguity can rerun reconciliation without refetching.
	return { inputs, results: reconcileCollections(inputs, existing), targets };
}

// Prefix target IDs so arbitrary IDs cannot collide with the create/abort prompt sentinels.
const TARGET_PREFIX = 'target:';

function matchedEntries(result: CollectionReconcile): Record<string, string> {
	const entries: Record<string, string> = {};
	for (const match of result.matched) entries[match.sourceId] = match.targetId;
	return entries;
}

interface ResolvedMatches {
	readonly seeds: ReadonlyMap<string, Record<string, string>>;
	// Excluded from later passes so an ambiguity is never prompted twice.
	readonly decided: readonly { collection: string; sourceId: string }[];
	// Only an existing-target answer can unlock a child's FK reconciliation.
	readonly resolvedExisting: boolean;
}

// Interactive pushes resolve ambiguities; non-interactive pushes report all of them and stop.
async function resolveMatches(results: readonly CollectionReconcile[], ctx: CliContext): Promise<ResolvedMatches> {
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
		const lines = ambiguities.map(
			(item) => `${item.collection} "${item.sourceId}" → one of ${item.targetIds.join(', ')}`,
		);

		throw new CliError('STATE', `Ambiguous target matches:\n  ${lines.join('\n  ')}`, {
			hint: 'Run d6s sync push interactively once to choose, then commit the updated id map.',
		});
	}

	const decided: { collection: string; sourceId: string }[] = [];
	let resolvedExisting = false;

	// One target cannot represent two sources; remove targets claimed by earlier answers in this pass.
	const taken = new Map<string, Set<string>>();

	for (const item of ambiguities) {
		const claimed = taken.get(item.collection) ?? new Set<string>();

		const options: { value: string; label: string }[] = [
			...item.targetIds.filter((id) => !claimed.has(id)).map((id) => ({ value: `${TARGET_PREFIX}${id}`, label: id })),
			{ value: 'create', label: 'Create a new record' },
			{ value: 'abort', label: 'Abort the push' },
		];

		const choice = await ask(
			select({
				message: `Multiple ${item.collection} records match source "${item.sourceId}". Pick the target:`,
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
	readonly skipped: false;
	readonly source: string;
	readonly targetUrl: string;
	readonly system: readonly SystemCollection[];
	readonly content: readonly DataCollection[];
	readonly map: IdMap;
	// Retained so a resolved ambiguity can trigger another pass without refetching.
	readonly inputs: readonly ReconcileInput[];
	readonly results: readonly CollectionReconcile[];
	// Missing entries disable unchanged detection, keeping every source row in the batch.
	readonly targets: ReadonlyMap<string, readonly Record<string, unknown>[]>;
}

async function readAndReconcile(target: Target): Promise<Reconciled | DataPushSkipped> {
	if (!hasDataFiles(target.dataDir)) {
		return { skipped: true };
	}

	const { source, collections } = readDataFiles(target.dataDir);

	if (collections.length === 0) return { skipped: true };

	const targetUrl = normalizeInstanceUrl(target.url);
	const { system, content } = partitionCollections(collections);
	const map = readIdMap(target.idMapPath);
	const { inputs, results, targets } = await reconcileSystem(system, target, mappingsFor(map, source, targetUrl));

	for (const data of content) {
		try {
			targets.set(
				data.collection,
				await fetchRecords(target.credential, {
					collection: data.collection,
					endpoint: `/items/${data.collection}`,
					primaryKey: data.primaryKey,
					singleton: false,
				}),
			);
		} catch (error) {
			// The collection may not exist until schema apply. On such fetch failures, keep every source row
			// in the batch; the import remains authoritative and may still report the underlying failure.
			// A CONFIG refusal (zero QUERY_LIMIT_MAX) must NOT be swallowed: it means every fetch is blind,
			// and under mirror a blind batch deletes the target rows the echo could not see.
			if (error instanceof CliError && error.code === 'CONFIG') throw error;
		}
	}

	return { skipped: false, source, targetUrl, system, content, map, inputs, results, targets };
}

// Compare only exported fields; target-only defaults and audit columns are outside the sync claim. The PK
// is excluded because mapped rows already establish identity and wire/map representations may differ.
function fieldsEqual(payload: Record<string, unknown>, target: Record<string, unknown>, pkField: string): boolean {
	for (const [key, value] of Object.entries(payload)) {
		if (key === pkField) continue;
		if (!isEqual(value, target[key])) return false;
	}

	return true;
}

// Three server behaviors shape the batch: add skips every row whose PK already exists on the target
// (mapped or not — an add-mode conflict inserts a duplicate, never an update); merge/mirror withhold an
// unmatched occupied numeric PK to avoid overwriting an unrelated row; mirror echoes user-attached
// access rows when users are out of scope so deletion does not remove target-local grants.
function assembleBatch(
	system: readonly SystemCollection[],
	content: readonly DataCollection[],
	bucket: Readonly<Record<string, Readonly<Record<string, string>>>>,
	mode: Mode,
	targets: ReadonlyMap<string, readonly Record<string, unknown>[]>,
): { batch: ImportCollectionData[]; systemSent: SystemSent[]; unchanged: UnchangedRows; records: number } {
	const batch: ImportCollectionData[] = [];
	const systemSent: SystemSent[] = [];
	const unchanged = new Map<string, Set<string>>();
	let records = 0;

	const includesUsers = system.some((entry) => entry.resource.collection === 'directus_users');

	// Mirror must carry unchanged rows to prevent deletion; merge/add can omit them.
	function markUnchanged(collection: string, pk: string): boolean {
		const set = unchanged.get(collection) ?? new Set<string>();
		set.add(pk);
		unchanged.set(collection, set);

		return mode === 'mirror';
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
				// add skips mapped rows to avoid duplicate inserts — but only while the mapped target row
				// still exists. A row deleted on the target would otherwise stay missing forever with no
				// signal (merge/mirror self-heal by sending the mapped PK; add's skip never would). When the
				// fetched target set proves the row absent, fall through: the remapped record imports under
				// its mapped PK, restoring the row without minting a new identity.
				const mappedPk = collectionBucket[sourceId];

				if (mappedPk === undefined || targetByPk.has(mappedPk)) continue;
			}

			const result = remapSystemRecord(record, resource.collection, resource.primaryKey, bucket);

			// add creates only: an unmapped row whose PK already exists on the target must be skipped, not
			// sent — the server resolves an add-mode conflict by minting a fresh UUID (or a fresh
			// auto-increment key), materializing a duplicate on every run.
			if (mode === 'add' && result.sent.sentPk !== null && targetByPk.has(result.sent.sentPk)) continue;

			if (mode !== 'add' && !mapped && typeof record[resource.primaryKey] === 'number' && targetByPk.has(sourceId)) {
				delete result.record[resource.primaryKey];
				items.push(result.record);
				sent.push({ sourceId, sentPk: null });
				continue;
			}

			if (mapped && result.sent.sentPk !== null) {
				const targetRow = targetByPk.get(result.sent.sentPk);

				if (
					targetRow !== undefined &&
					fieldsEqual(result.record, targetRow, resource.primaryKey) &&
					!markUnchanged(resource.collection, result.sent.sentPk)
				) {
					continue;
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

	for (const data of content) {
		// Without target rows, unchanged detection stays conservative and sends every source row.
		const targetRows = targets.get(data.collection);
		const targetByPk = new Map((targetRows ?? []).map((row) => [String(row[data.primaryKey]), row]));

		const items: Record<string, unknown>[] = [];

		for (const record of data.records) {
			const pk = String(record[data.primaryKey]);
			const targetRow = targetRows === undefined ? undefined : targetByPk.get(pk);

			// add creates only: a content PK already on the target is skipped even when fields differ —
			// an add-mode import would not update the existing row but insert a duplicate beside it.
			if (mode === 'add' && targetRow !== undefined) continue;

			if (
				targetRow !== undefined &&
				fieldsEqual(record, targetRow, data.primaryKey) &&
				!markUnchanged(data.collection, pk)
			) {
				continue;
			}

			items.push(record);
		}

		batch.push({ collection: data.collection, items });
		records += items.length;
	}

	return { batch, systemSent, unchanged, records };
}

/**
 * Reconcile system identities, persist resolved matches, and prepare the import batch. An existing-target
 * ambiguity answer reruns reconciliation so newly translatable child keys do not import as duplicates.
 */
export async function prepareDataPush(target: Target, mode: Mode, ctx: CliContext): Promise<DataPushResult> {
	const reconciled = await readAndReconcile(target);

	if (reconciled.skipped) return { skipped: true };

	const { source, targetUrl, system, content, inputs, targets } = reconciled;

	// Persist learned identities even if a later gate aborts. Existing-target answers can unlock child FK
	// keys, so rerun with cached inputs while excluding every source already prompted.
	let map = reconciled.map;
	let results = reconciled.results;
	const decided = new Map<string, Set<string>>();

	for (;;) {
		const resolved = await resolveMatches(results, ctx);

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
		content,
		mappingsFor(map, source, targetUrl),
		mode,
		targets,
	);

	return {
		skipped: false,
		source,
		target: targetUrl,
		idMapPath: target.idMapPath,
		map,
		batch,
		systemSent,
		unchanged,
		records,
		collections: batch.length,
	};
}

/** A read-only, conservative data batch preview plus reconciliation counts. */
export interface DataPreviewPlan {
	readonly skipped: false;
	readonly source: string;
	readonly batch: ImportCollectionData[];
	readonly unchanged: UnchangedRows;
	readonly records: number;
	readonly matchedCount: number;
	readonly ambiguousCount: number;
	readonly unmatchedCount: number;
	readonly unchangedCount: number;
}

export type DataPreviewResult = DataPreviewPlan | DataPushSkipped;

/**
 * Preview without prompting or writing. Unambiguous matches are applied in memory; ambiguous sources stay
 * unmapped, so an interactive push may produce a different batch after the operator resolves them.
 */
export async function previewData(target: Target, mode: Mode): Promise<DataPreviewResult> {
	const reconciled = await readAndReconcile(target);

	if (reconciled.skipped) return { skipped: true };

	const { source, targetUrl, system, content, results, targets } = reconciled;

	// Seed only unambiguous matches into the in-memory map; diff never settles identity choices.
	let map = reconciled.map;
	let matchedCount = 0;
	let ambiguousCount = 0;
	let unmatchedCount = 0;

	for (const result of results) {
		matchedCount += result.matched.length;
		ambiguousCount += result.ambiguous.length;
		unmatchedCount += result.unmatched.length;

		if (result.matched.length === 0) continue;

		map = withMappings(map, source, targetUrl, result.collection, matchedEntries(result));
	}

	const { batch, unchanged, records } = assembleBatch(
		system,
		content,
		mappingsFor(map, source, targetUrl),
		mode,
		targets,
	);

	let unchangedCount = 0;
	for (const set of unchanged.values()) unchangedCount += set.size;

	return {
		skipped: false,
		source,
		batch,
		unchanged,
		records,
		matchedCount,
		ambiguousCount,
		unmatchedCount,
		unchangedCount,
	};
}
