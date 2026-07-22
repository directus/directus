import { select } from '@clack/prompts';
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
import {
	type CollectionReconcile,
	hasNaturalKey,
	reconcileCollections,
	type ReconcileInput,
} from '../../sync/reconcile.js';
import { allResources, type Resource } from '../../sync/resources.js';
import type { Target } from './resolve-target.js';

// The data phase of push, orchestrated: read the committed records, remap their primary keys and static
// FK fields from source-instance space into target space (seeding the ID map first via reconcile where a
// natural key allows), and hand push a flat import batch plus the map-update bookkeeping. The remap and
// batch-assembly logic is pure and unit-tested; the network fetch, prompting, and map persistence live
// here so push stays composition-and-gates only.

/**
 * The pre-remap source id paired with the primary key actually sent for one system record. push needs
 * both to update the map after import: the map entry is sourceId → (server-remapped pk ?? sentPk).
 */
export interface SentRecord {
	readonly sourceId: string;
	readonly sentPk: string;
}

export interface SystemSent {
	readonly collection: string;
	readonly records: readonly SentRecord[];
}

/**
 * A prepared data push: the flat batch to import, the per-system-collection send record for the map
 * update, and the map/urls push persists the import response into. Content collections carry no send
 * record — they are never reconciled and their primary keys pass through as-is.
 */
export interface DataPushPlan {
	readonly skipped: false;
	readonly source: string; // normalized source-instance URL, from the data's metadata
	readonly target: string; // normalized target-instance URL
	readonly idMapPath: string;
	readonly map: IdMap; // the map after reconcile matches were persisted
	readonly batch: ImportCollectionData[];
	readonly systemSent: readonly SystemSent[];
	readonly records: number; // total records across the batch
	readonly collections: number; // batch entries (system + content)
}

/**
 * The skip outcome: an older checkout committed schema without data. push must still run (schema-only)
 * and report the data phase as skipped rather than failing.
 */
export interface DataPushSkipped {
	readonly skipped: true;
}

export type DataPushResult = DataPushPlan | DataPushSkipped;

// One committed collection matched to its resource definition (endpoint, primary key, FK table). System
// collections carry a resource; content collections do not.
interface SystemCollection {
	readonly data: DataCollection;
	readonly resource: Resource;
}

/**
 * Partition the committed collections into system (a resolveResources graph member — remappable, and
 * reconcilable when it has a natural key) and content (everything else, passed through untouched). System
 * order is the resource graph's dependency order so a child's FK translates through a parent already
 * seeded this run; content is codepoint-sorted after.
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
 * One system record rewritten from source space into target space. The primary key and every static FK
 * field (SYSTEM_FK_FIELDS) are replaced when the bucket for the referenced collection holds a mapping; a
 * miss leaves the value verbatim — an in-batch new record the server links, or a genuinely dangling
 * reference the server rejects, never a guess. A null/undefined FK is a legitimate value and untouched.
 * Pure: the input record is never mutated.
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

// Fetch each reconcilable system collection's target records and reconcile them against the committed
// source records, against the committed map bucket. panels and content are excluded upstream — reconcile
// throws on a collection with no natural key by design.
//
// Order matters and is the REVERSE of the batch's resolveResources order. reconcile translates a child's
// FK natural-key components through parents already matched this run, so it needs referenced-before-
// referencer order (roles before access, flows before operations). resolveResources emits its must-pull
// order — referencer first (policies must-pull access, so access precedes policies) — which is exactly
// that reverse. Consuming it reversed here gives reconcile the parents-first order its contract demands;
// passing the forward order would leave every access/operations row unmatched (untranslatable parent FK).
async function reconcileSystem(
	system: readonly SystemCollection[],
	target: Target,
	existing: Readonly<Record<string, Readonly<Record<string, string>>>>,
): Promise<CollectionReconcile[]> {
	const inputs: ReconcileInput[] = [];

	for (const { data, resource } of [...system].reverse()) {
		if (!hasNaturalKey(resource.collection)) continue;

		const targetRecords = await fetchRecords(target.credential, {
			collection: resource.collection,
			endpoint: resource.endpoint,
			primaryKey: resource.primaryKey,
			singleton: resource.singleton,
		});

		inputs.push({
			collection: resource.collection,
			primaryKey: resource.primaryKey,
			sourceRecords: data.records,
			targetRecords,
		});
	}

	return reconcileCollections(inputs, existing);
}

// The clack select value for one ambiguity choice, encoded as a string so the option list is a single
// value type. A target id is prefixed 'target:' — an injective encoding, so it can never collide with the
// fixed 'create' (leave unmapped; the server inserts and remaps) or 'abort' sentinels even if an id
// happens to spell one of them.
const TARGET_PREFIX = 'target:';

// One reconcile result's unambiguous matches as sourceId → targetId. Shared by the two consumers so the
// seed shape is identical whether push persists it or preview folds it into an in-memory map.
function matchedEntries(result: CollectionReconcile): Record<string, string> {
	const entries: Record<string, string> = {};
	for (const match of result.matched) entries[match.sourceId] = match.targetId;
	return entries;
}

// Resolve reconcile into the map seeds to persist: every unambiguous match, plus each ambiguity's answer.
// Interactive asks per ambiguity (pick a candidate, create new, or abort); non-interactive refuses loud,
// listing every ambiguity so the operator can resolve them all in one interactive run. Returns
// collection → (sourceId → targetId).
async function resolveMatches(
	results: readonly CollectionReconcile[],
	ctx: CliContext,
): Promise<Map<string, Record<string, string>>> {
	const seeds = new Map<string, Record<string, string>>();

	for (const result of results) {
		if (result.matched.length === 0) continue;
		seeds.set(result.collection, matchedEntries(result));
	}

	const ambiguities = results.flatMap((result) =>
		result.ambiguous.map((item) => ({ collection: result.collection, ...item })),
	);

	if (ambiguities.length === 0) return seeds;

	if (!ctx.interactive) {
		const lines = ambiguities.map(
			(item) => `${item.collection} "${item.sourceId}" → one of ${item.targetIds.join(', ')}`,
		);

		throw new CliError('STATE', `Ambiguous target matches:\n  ${lines.join('\n  ')}`, {
			hint: 'Run d6s sync push interactively once to choose, then commit the updated id map.',
		});
	}

	for (const item of ambiguities) {
		const options: { value: string; label: string }[] = [
			...item.targetIds.map((id) => ({ value: `${TARGET_PREFIX}${id}`, label: id })),
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

		if (choice.startsWith(TARGET_PREFIX)) {
			const entries = seeds.get(item.collection) ?? {};
			entries[item.sourceId] = choice.slice(TARGET_PREFIX.length);
			seeds.set(item.collection, entries);
		}
	}

	return seeds;
}

// The read-only output of readAndReconcile: the committed data split into system/content, the reconcile
// results against the target, and the map exactly as read. Both callers share this stem but consume it
// differently — push persists the matches, preview keeps them in memory — so it holds only facts, no
// decisions about what to write.
interface Reconciled {
	readonly skipped: false;
	readonly source: string;
	readonly targetUrl: string;
	readonly system: readonly SystemCollection[];
	readonly content: readonly DataCollection[];
	readonly map: IdMap;
	readonly results: readonly CollectionReconcile[];
}

// The read-and-reconcile stem both entries share: an absent data directory (or an empty committed set) is
// a schema-only checkout that skips rather than fails; otherwise read {source, collections}, split
// system/content, and reconcile the reconcilable system collections against the target's current records
// and the committed map. Strictly READ-ONLY — it fetches and computes but never prompts and never writes —
// so push and preview can never diverge on what "the same record" means before one of them acts on it.
async function readAndReconcile(target: Target): Promise<Reconciled | DataPushSkipped> {
	// An absent data directory is a schema-only checkout: skip rather than fail. A present directory with
	// no source recorded, or corruption, fails loud inside readDataFiles — never silently skipped.
	if (!hasDataFiles(target.dataDir)) {
		return { skipped: true };
	}

	const { source, collections } = readDataFiles(target.dataDir);

	if (collections.length === 0) return { skipped: true };

	const targetUrl = normalizeInstanceUrl(target.url);
	const { system, content } = partitionCollections(collections);
	const map = readIdMap(target.idMapPath);
	const results = await reconcileSystem(system, target, mappingsFor(map, source, targetUrl));

	return { skipped: false, source, targetUrl, system, content, map, results };
}

// Remap every system record into target space through `bucket` and assemble the flat import batch in
// system-then-content order: a system record's PK and static FKs are rewritten and its (sourceId, sentPk)
// captured for the post-import map update; content records pass through codepoint-sorted and verbatim.
// Pure — the caller chooses which bucket to remap against (push's persisted map, preview's in-memory one).
function assembleBatch(
	system: readonly SystemCollection[],
	content: readonly DataCollection[],
	bucket: Readonly<Record<string, Readonly<Record<string, string>>>>,
): { batch: ImportCollectionData[]; systemSent: SystemSent[]; records: number } {
	const batch: ImportCollectionData[] = [];
	const systemSent: SystemSent[] = [];
	let records = 0;

	for (const { data, resource } of system) {
		const items: Record<string, unknown>[] = [];
		const sent: SentRecord[] = [];

		for (const record of data.records) {
			const result = remapSystemRecord(record, resource.collection, resource.primaryKey, bucket);
			items.push(result.record);
			sent.push(result.sent);
		}

		batch.push({ collection: resource.collection, items });
		systemSent.push({ collection: resource.collection, records: sent });
		records += items.length;
	}

	for (const data of content) {
		batch.push({ collection: data.collection, items: data.records });
		records += data.records.length;
	}

	return { batch, systemSent, records };
}

/**
 * Prepare the data phase, or report it skipped. Reconcile the reconcilable system collections against the
 * target and persist the matches immediately (identity facts survive an aborted push), prompting on
 * ambiguity (interactive) or refusing loud (CI); then remap every record through the updated map and
 * assemble the batch plus the send record push needs to fold the import response back into the map.
 */
export async function prepareDataPush(target: Target, ctx: CliContext): Promise<DataPushResult> {
	const reconciled = await readAndReconcile(target);

	if (reconciled.skipped) return { skipped: true };

	const { source, targetUrl, system, content, results } = reconciled;

	// Persist matches BEFORE remapping so a later aborted push keeps the identities it learned, then
	// recompute the bucket from the updated map for the remap.
	let map = reconciled.map;
	const seeds = await resolveMatches(results, ctx);

	for (const [collection, entries] of seeds) {
		map = withMappings(map, source, targetUrl, collection, entries);
	}

	if (seeds.size > 0) writeIdMap(target.idMapPath, map);

	const { batch, systemSent, records } = assembleBatch(system, content, mappingsFor(map, source, targetUrl));

	return {
		skipped: false,
		source,
		target: targetUrl,
		idMapPath: target.idMapPath,
		map,
		batch,
		systemSent,
		records,
		collections: batch.length,
	};
}

/**
 * A read-only preview of the data phase for diff: the batch a push would import (remapped through the
 * unambiguous matches only) and the reconcile tally. No map, no send record, no idMapPath — nothing here
 * is ever written back to disk.
 */
export interface DataPreviewPlan {
	readonly skipped: false;
	readonly source: string; // normalized source-instance URL, from the data's metadata
	readonly batch: ImportCollectionData[];
	readonly matchedCount: number; // sources matched to a target this run — applied to the batch in memory
	readonly ambiguousCount: number; // sources with several candidate targets — only an interactive push resolves them
	readonly unmatchedCount: number; // sources with no target match yet — a first push inserts and remaps them
}

export type DataPreviewResult = DataPreviewPlan | DataPushSkipped;

/**
 * Preview the data phase for diff (spec Q15) WITHOUT prompting or writing: reconcile, seed only the
 * unambiguous matches into an in-memory copy of the map so the remapped batch is truthful, and count the
 * ambiguous and unmatched sources rather than resolving them. The on-disk map is never touched — the hard
 * invariant of diff — so an ambiguity is reported for the first push to settle, never guessed here.
 */
export async function previewData(target: Target): Promise<DataPreviewResult> {
	const reconciled = await readAndReconcile(target);

	if (reconciled.skipped) return { skipped: true };

	const { source, targetUrl, system, content, results } = reconciled;

	// withMappings is pure, so seeding these matches grows a fresh map object and never writes the file.
	// Ambiguous sources are deliberately left unmapped: the preview's dry-run then shows them as the
	// inserts a first push would create, and they are tallied for the reconcile note.
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

	const { batch } = assembleBatch(system, content, mappingsFor(map, source, targetUrl));

	return { skipped: false, source, batch, matchedCount, ambiguousCount, unmatchedCount };
}
