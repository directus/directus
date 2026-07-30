import { select } from '@clack/prompts';
import { isEqual } from 'lodash-es';
import { fetchQueryLimitMax } from '../../kernel/connection.js';
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
	/** Collections the committed manifest marks as truncated at pull time; mirror must refuse them. */
	readonly incomplete: readonly string[];
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
			// The file's declared primaryKey drives row validation and duplicate-PK detection at read time,
			// while every consumer below keys on the catalog's — a hand-edited declaration would make the
			// dedup guard watch the wrong column, letting two rows with one real id ship in the batch.
			if (data.primaryKey !== resource.primaryKey) {
				throw new CliError(
					'STATE',
					`The committed data file for ${data.collection} declares primary key "${data.primaryKey}", but this collection's primary key is "${resource.primaryKey}".`,
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
	queryMax: number | undefined,
): Promise<{
	inputs: ReconcileInput[];
	results: CollectionReconcile[];
	targets: Map<string, readonly Record<string, unknown>[]>;
}> {
	const inputs: ReconcileInput[] = [];
	const targets = new Map<string, readonly Record<string, unknown>[]>();

	for (const { data, resource } of [...system].reverse()) {
		const targetRecords = await fetchRecords(
			target.credential,
			{
				collection: resource.collection,
				endpoint: resource.endpoint,
				primaryKey: resource.primaryKey,
				singleton: resource.singleton,
				drop: resource.drop,
				keyset: resource.keyset,
			},
			queryMax,
		);

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
	// Excluded from later passes so an ambiguity is never prompted twice.
	readonly decided: readonly { collection: string; sourceId: string }[];
	// Only an existing-target answer can unlock a child's FK reconciliation.
	readonly resolvedExisting: boolean;
}

// Interactive pushes resolve ambiguities; non-interactive pushes report all of them and stop.
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
			hint: 'Run d6s sync push interactively once to choose, then commit the updated id map.',
		});
	}

	const decided: { collection: string; sourceId: string }[] = [];
	let resolvedExisting = false;

	// One target cannot represent two sources; remove targets claimed by earlier answers in this pass.
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
	readonly skipped: false;
	readonly source: string;
	readonly targetUrl: string;
	readonly system: readonly SystemCollection[];
	readonly map: IdMap;
	readonly incomplete: readonly string[];
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

	const { source, collections, incomplete } = readDataFiles(target.dataDir);

	if (collections.length === 0) return { skipped: true };

	const targetUrl = normalizeInstanceUrl(target.url);
	const { system, content } = partitionCollections(collections);

	// partitionCollections claims only cataloged system collections, so an unknown directus_* file (hand-
	// committed, or written by a different CLI version) lands in `content` — but calling it a content
	// collection would misdirect the operator toward the deferred-content advice. Name it for what it is.
	const unknownSystem = content.filter((data) => data.collection.startsWith('directus_'));

	if (unknownSystem.length > 0) {
		throw new CliError(
			'STATE',
			`The committed data files contain system collections this CLI version does not sync: ${unknownSystem.map((data) => data.collection).join(', ')}.`,
			{ hint: 'Delete those data files and re-pull, or use a CLI version that syncs them.' },
		);
	}

	// Content sync is deferred from this release — pull no longer writes content data files, so any that
	// remain are committed leftovers whose rows this CLI can no longer import safely (a raw integer content
	// PK can silently overwrite an unrelated target row). Refuse before any target read or import; push and
	// diff both flow through here, so this one gate covers both.
	if (content.length > 0) {
		throw new CliError(
			'STATE',
			`The committed data files contain content collections: ${content.map((data) => data.collection).join(', ')}.`,
			{
				hint: 'Content sync is deferred in this release — the CLI syncs schema and configuration only. Delete those data files and re-pull.',
			},
		);
	}

	const map = readIdMap(target.idMapPath);

	// One keystone read per push covers every reconcile fetch below (Judd's "2 requests per resource" —
	// each target read otherwise costs a fetch plus an exhaustion probe). Best-effort; undefined keeps the probe.
	const queryMax = await fetchQueryLimitMax(target.credential);

	const { inputs, results, targets } = await reconcileSystem(
		system,
		target,
		mappingsFor(map, source, targetUrl),
		queryMax,
	);

	return { skipped: false, source, targetUrl, system, map, incomplete, inputs, results, targets };
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
// unmatched auto-increment PK so the server never treats a colliding id as identity; mirror echoes user-attached
// access rows when users are out of scope so deletion does not remove target-local grants.
function assembleBatch(
	system: readonly SystemCollection[],
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

			// merge/mirror never send a raw source auto-increment PK for an unmatched row. The server's
			// existence check runs inside the import transaction, so a source id can collide with a row this
			// same batch just inserted — or with an entitlement-hidden target row the fetched set never
			// showed (unlicensed /permissions reads filter custom-rule rows) — and silently overwrite it.
			// The earlier guard only fired when the fetched target set proved the id occupied, which that
			// filter defeats; withhold unconditionally instead. The server inserts fresh and the row is
			// re-identified by natural key next push (only natural-keyed resources reach here). No map entry
			// is recorded: the assigned id is unreported and a guess would bind the source to the wrong row.
			if (mode !== 'add' && !mapped && typeof record[resource.primaryKey] === 'number') {
				// A numeric-PK resource outside the natural-key table could never re-identify the withheld
				// row, but falling through would send the raw source integer — the exact silent-overwrite
				// class the withhold exists to prevent. Unreachable with today's catalog; a catalog edit that
				// breaks the invariant must fail the push, not the target's data.
				if (!hasNaturalKey(resource.collection)) {
					throw new CliError(
						'STATE',
						`No natural key defined for numeric-primary-key collection "${resource.collection}".`,
						{ hint: 'The natural-key table is out of date with the synced collection set.' },
					);
				}

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

	return { batch, systemSent, unchanged, records };
}

/**
 * Reconcile system identities, persist resolved matches, and prepare the import batch. An existing-target
 * ambiguity answer reruns reconciliation so newly translatable child keys do not import as duplicates.
 */
export async function prepareDataPush(target: Target, mode: Mode, ctx: CliContext): Promise<DataPushResult> {
	const reconciled = await readAndReconcile(target);

	if (reconciled.skipped) return { skipped: true };

	const { source, targetUrl, system, inputs, targets } = reconciled;

	// Persist learned identities even if a later gate aborts. Existing-target answers can unlock child FK
	// keys, so rerun with cached inputs while excluding every source already prompted.
	let map = reconciled.map;
	let results = reconciled.results;
	const decided = new Map<string, Set<string>>();

	for (;;) {
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
		incomplete: reconciled.incomplete,
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
	/** Collections the committed manifest marks as truncated at pull time; push refuses mirror on them. */
	readonly incomplete: readonly string[];
}

export type DataPreviewResult = DataPreviewPlan | DataPushSkipped;

/**
 * Preview without prompting or writing. Unambiguous matches are applied in memory; ambiguous sources —
 * and every record whose FK chain leads to one — are excluded from the batch and surfaced only through
 * ambiguousCount: an interactive push resolves them (possibly into updates) and a non-interactive push
 * refuses until they are resolved.
 */
export async function previewData(target: Target, mode: Mode): Promise<DataPreviewResult> {
	const reconciled = await readAndReconcile(target);

	if (reconciled.skipped) return { skipped: true };

	const { source, targetUrl, system, results, targets } = reconciled;

	// Seed only unambiguous matches into the in-memory map; diff never settles identity choices. Matched
	// entries stay seeded even when the closure below excludes their record — the seeding writes nothing,
	// and the pairs point at real target rows, so any remaining row that remaps through them stays valid.
	let map = reconciled.map;
	const excluded = new Map<string, Set<string>>();

	for (const result of results) {
		if (result.ambiguous.length > 0) {
			excluded.set(result.collection, new Set(result.ambiguous.map((entry) => entry.sourceId)));
		}

		if (result.matched.length === 0) continue;

		map = withMappings(map, source, targetUrl, result.collection, matchedEntries(result));
	}

	// An ambiguous source is neither a create nor an update yet: an interactive push resolves it, a
	// non-interactive push refuses outright. Left in the batch it would ride as a CREATE and the dry-run
	// would count it — a preview lying in both directions — so it is excluded and reported unresolved.
	//
	// Its dependents must drop with it: an excluded source id resolves to NOTHING — the row is out of the
	// batch and, being ambiguous, unmapped on the target — so a dependent still carrying that FK makes the
	// server-side dry-run fail on the reference and diff error instead of previewing. A conservative
	// preview beats one that 400s; diff must never error on a state push can handle. Only an FK actually
	// holding an excluded source id dangles — null FKs and FKs to non-excluded rows remap or pass through.
	// Iterate to a fixed point so self-referential chains (directus_folders.parent) drop whole subtrees
	// regardless of record order.
	for (let changed = true; changed; ) {
		changed = false;

		for (const { data, resource } of system) {
			const fks = SYSTEM_FK_FIELDS[resource.collection] ?? [];

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

	// Every excluded record counts as unresolved and leaves matched/unmatched, so the categories still
	// partition the committed set and diff's pending total does not double-count.
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
		skipped: false,
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
