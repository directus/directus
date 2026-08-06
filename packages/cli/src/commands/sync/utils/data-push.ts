import { relative } from 'node:path';
import { note, select } from '@clack/prompts';
import { isEqual } from 'lodash-es';
import type { SyncMode } from '../../../kernel/config/mode.js';
import { fetchQueryLimitMax } from '../../../kernel/connection.js';
import { CliError } from '../../../kernel/error.js';
import { ask } from '../../../kernel/prompt.js';
import type { CliContext } from '../../../kernel/run.js';
import { count } from '../../../kernel/text.js';
import { fetchRecords } from './api.js';
import { byCodepoint } from './codepoint.js';
import type { ImportCollectionData } from './contract.js';
import { type DataCollection, readDataFiles } from './data-store.js';
import { type IdMap, mappingsFor, normalizeInstanceUrl, readIdMap, withMappings, writeIdMap } from './id-map.js';
import { type CollectionReconcile, reconcileCollections, type ReconcileInput } from './reconcile.js';
import { displayProjectPath, type Target } from './resolve-target.js';
import { allResources, type Resource } from './resources.js';

/** A source ID and the primary key sent for it. */
interface SentRecord {
	readonly sourceId: string;
	readonly sentPk: string;
	/** The sent key is an invented temporary; only a `mapped` response entry can supply the real target ID. */
	readonly temporary?: true;
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
					`The local file for ${data.collection} declares primary key "${data.primaryKey}", but this collection's primary key is "${resource.primaryKey}".`,
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

/** One source record whose natural key matches several target records, tagged with the collection it came from. */
type Ambiguity = CollectionReconcile['ambiguous'][number] & { readonly collection: string };

const UNNAMED_IDENTITY = 'with this identity';

/**
 * Name the natural key that made records collide, in the resource's own field names. Composite keys name
 * every field: a resource that needs three fields to identify a record is exactly the one whose records
 * carry no human-readable label, so `UNNAMED_IDENTITY` would leave the reader nothing to search for.
 */
function identityPhrase(input: ReconcileInput | undefined, source: Record<string, unknown> | undefined): string {
	if (input === undefined || source === undefined) return UNNAMED_IDENTITY;

	const rendered: { field: string; value: string }[] = [];

	for (const field of input.naturalKey) {
		const value = scalar(source[field]);

		// The unused half of an either/or key (an access grant carries a role or a user) names nothing.
		if (value === undefined || value === 'null') continue;

		rendered.push({ field, value });
	}

	if (rendered.length === 0) return UNNAMED_IDENTITY;

	const only = rendered.length === 1 ? rendered[0] : undefined;

	if (only?.field === 'name') return `named ${only.value}`;

	return `with ${rendered.map((entry) => `${entry.field} ${entry.value}`).join(', ')}`;
}

/**
 * Grow a set of excluded source IDs until it is closed under foreign keys: a record pointing at an excluded
 * record cannot be sent either, or its FK would dangle. Iterates because self-referential chains (a folder
 * under a folder) deepen one level per pass. Mutates `excluded` in place.
 */
function excludeDependents(system: readonly SystemCollection[], excluded: Map<string, Set<string>>): void {
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
}

/** How many records a set of ambiguities holds back beyond the ambiguous records themselves. */
function dependentCountOf(
	system: readonly SystemCollection[],
	ambiguities: readonly { collection: string; sourceId: string }[],
): number {
	const excluded = new Map<string, Set<string>>();

	for (const item of ambiguities) {
		const dropped = excluded.get(item.collection) ?? new Set<string>();
		dropped.add(item.sourceId);
		excluded.set(item.collection, dropped);
	}

	excludeDependents(system, excluded);

	let total = 0;
	for (const dropped of excluded.values()) total += dropped.size;

	return total - ambiguities.length;
}

function itemUiUrl(instance: string, resource: Resource | undefined, id: string): string | undefined {
	if (resource?.appRoute === undefined) return undefined;
	return `${normalizeInstanceUrl(instance)}${resource.appRoute}/${encodeURIComponent(id)}`;
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

/**
 * State where a collision sits: how many local records claim one identity, and how many target records
 * answer to it. Both the refusal and the prompt open with these, so they cannot drift apart.
 */
function collisionLines(
	item: Ambiguity,
	ambiguities: readonly Ambiguity[],
	inputs: readonly ReconcileInput[],
	target: Target,
	ctx: CliContext,
): [string, string] {
	const input = inputs.find((candidate) => candidate.collection === item.collection);
	const source = input?.sourceRecords.find((record) => String(record[input.primaryKey]) === item.sourceId);
	const resource = allResources().find((candidate) => candidate.collection === item.collection);
	const singular = resource?.singular ?? 'record';
	const plural = resource?.plural ?? 'records';

	const local = ambiguities.filter(
		(candidate) => candidate.collection === item.collection && candidate.key === item.key,
	).length;

	const projectPath = ctx.ui.style.strong(displayProjectPath(ctx.cwd, target.projectDir));

	return [
		`${projectPath} contains ${local} ${local === 1 ? singular : plural} ${identityPhrase(input, source)}.`,
		`${ctx.ui.style.strong(target.profile)} — ${ctx.ui.style.muted(target.url)} contains ${item.targetIds.length} matching ${item.targetIds.length === 1 ? singular : plural}.`,
	];
}

function differenceHint(
	source: Record<string, unknown> | undefined,
	target: Record<string, unknown> | undefined,
	primaryKey: string,
	mode: SyncMode,
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
				: `${field}: local ${before}, target ${after}`,
		);
	}

	if (differences.length === 0) return 'Same synced values; only the ID differs';

	const shown = differences.slice(0, 2).join('; ');
	const detail = differences.length > 2 ? `${shown}; +${differences.length - 2} more differences` : shown;

	const effect =
		mode === 'add' ? 'Add keeps the target unchanged' : `${mode === 'merge' ? 'Merge' : 'Mirror'} updates the target`;

	return `${effect}; ${detail}`;
}

function matchedEntries(result: CollectionReconcile): Record<string, string> {
	const entries: Record<string, string> = {};
	for (const match of result.matched) entries[match.sourceId] = match.targetId;
	return entries;
}

interface ResolvedMatches {
	readonly seeds: ReadonlyMap<string, Record<string, string>>;
	readonly decided: readonly { collection: string; sourceId: string; targetId: string | null }[];
	readonly resolvedExisting: boolean;
}

async function resolveMatches(
	results: readonly CollectionReconcile[],
	inputs: readonly ReconcileInput[],
	system: readonly SystemCollection[],
	target: Target,
	sourceUrl: string,
	mode: SyncMode,
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
		const lines: string[] = [];
		const rendered = new Set<string>();

		for (const item of ambiguities) {
			const groupKey = `${item.collection}\0${item.key}`;
			if (rendered.has(groupKey)) continue;
			rendered.add(groupKey);

			const [local, remote] = collisionLines(item, ambiguities, inputs, target, ctx);
			lines.push(`${item.collection}: ${local}`, remote);
		}

		// Name what else is held back: the dependents need no decision of their own, so a bare ambiguity
		// count understates the push by every record waiting on one.
		const dependents = dependentCountOf(system, ambiguities);

		const held =
			dependents === 0
				? ''
				: `; ${count(dependents, 'record')} ${dependents === 1 ? 'depends' : 'depend'} on ${ambiguities.length === 1 ? 'that choice' : 'those choices'}`;

		throw new CliError(
			'STATE',
			`Push refused: ${ambiguities.length} target ${ambiguities.length === 1 ? 'match needs' : 'matches need'} a choice${held}.\n  ${lines.join('\n  ')}`,
			{ hint: 'Run d6s sync push interactively once to choose, then commit the updated ID map.' },
		);
	}

	const decided: { collection: string; sourceId: string; targetId: string | null }[] = [];
	let resolvedExisting = false;

	// Keep the owner, not only occupancy, so a later prompt can explain where its candidate went.
	const taken = new Map<string, Map<string, string>>();

	for (const [index, item] of ambiguities.entries()) {
		const claimed = taken.get(item.collection) ?? new Map<string, string>();
		const input = inputs.find((candidate) => candidate.collection === item.collection);
		const primaryKey = input?.primaryKey ?? 'id';
		const source = input?.sourceRecords.find((record) => String(record[primaryKey]) === item.sourceId);
		const resource = allResources().find((candidate) => candidate.collection === item.collection);
		const singular = resource?.singular ?? 'record';
		const plural = resource?.plural ?? 'records';

		const context = [
			...collisionLines(item, ambiguities, inputs, target, ctx),
			'',
			`${ctx.ui.style.strong(`${singular[0]?.toUpperCase() ?? ''}${singular.slice(1)}:`)} ${recordLabel(source, primaryKey, item.sourceId)}`,
		];

		const sourceLink = itemUiUrl(sourceUrl, resource, item.sourceId);
		if (sourceLink !== undefined) context.push(`Source UI: ${ctx.ui.style.muted(sourceLink)}`);

		const claimedIds = item.targetIds.filter((id) => claimed.has(id));

		if (claimedIds.length > 0) {
			context.push('');

			if (claimedIds.length === 1 && item.targetIds.length === 1) {
				const targetId = claimedIds[0]!;
				const ownerId = claimed.get(targetId)!;
				const targetRecord = input?.targetRecords.find((record) => String(record[primaryKey]) === targetId);
				const owner = input?.sourceRecords.find((record) => String(record[primaryKey]) === ownerId);

				context.push(
					ctx.ui.style.warning(
						`The only matching target ${singular} ${recordLabel(targetRecord, primaryKey, targetId)} was already matched to`,
					),
					ctx.ui.style.warning(`${recordLabel(owner, primaryKey, ownerId)} earlier in this push.`),
				);
			} else {
				context.push(
					ctx.ui.style.warning(
						`${claimedIds.length} matching target ${claimedIds.length === 1 ? singular : plural} already matched earlier in this push.`,
					),
				);
			}
		}

		const targetLinks = item.targetIds
			.map((id) => itemUiUrl(target.url, resource, id))
			.filter((url): url is string => url !== undefined);

		for (const [linkIndex, link] of targetLinks.entries()) {
			const styledLink = ctx.ui.style.muted(link);
			context.push(targetLinks.length === 1 ? `Target UI: ${styledLink}` : `Target UI ${linkIndex + 1}: ${styledLink}`);
		}

		note(context.join('\n'), `${item.collection} — ${index + 1} of ${ambiguities.length}`);

		const identity = scalar(source?.['name']);

		const createHint =
			identity === undefined ? `Creates another ${singular}` : `Creates another ${identity} ${singular}`;

		const options: { value: string; label: string; hint: string }[] = [
			...item.targetIds
				.filter((id) => !claimed.has(id))
				.map((id) => {
					const target = input?.targetRecords.find((record) => String(record[primaryKey]) === id);
					return {
						value: `${TARGET_PREFIX}${id}`,
						label: `Existing target ${singular} ${recordLabel(target, primaryKey, id)}`,
						hint: differenceHint(source, target, primaryKey, mode),
					};
				}),
			{
				value: 'create',
				label: `No existing ${singular} — create a new one on the target`,
				hint: mode === 'mirror' ? `${createHint}; unmatched target records may be deleted` : createHint,
			},
			{ value: 'abort', label: 'Abort push', hint: 'Applies no remote changes' },
		];

		const choice = await ask(
			select({
				message: `Which target ${singular} does this represent?`,
				options,
			}),
		);

		if (choice === 'abort') throw new CliError('STATE', 'Push aborted.');

		const targetId = choice.startsWith(TARGET_PREFIX) ? choice.slice(TARGET_PREFIX.length) : null;
		decided.push({ collection: item.collection, sourceId: item.sourceId, targetId });

		if (targetId !== null) {
			claimed.set(targetId, item.sourceId);
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
			`The local files contain system collections this CLI version does not sync: ${unknownSystem.map((data) => data.collection).join(', ')}.`,
			{ hint: 'Delete those files and re-pull, or use a CLI version that syncs them.' },
		);
	}

	if (content.length > 0) {
		throw new CliError(
			'STATE',
			`The local files contain content collections: ${content.map((data) => data.collection).join(', ')}.`,
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
	const decisions: { collection: string; sourceId: string; targetId: string | null }[] = [];

	while (true) {
		const resolved = await resolveMatches(results, inputs, system, target, source, mode, ctx);

		for (const item of resolved.decided) {
			const settled = decided.get(item.collection) ?? new Set<string>();
			settled.add(item.sourceId);
			decided.set(item.collection, settled);
			decisions.push(item);
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

	if (ctx.interactive && decisions.length > 0) {
		const lines = decisions.map((decision) => {
			const input = inputs.find((candidate) => candidate.collection === decision.collection);
			const primaryKey = input?.primaryKey ?? 'id';
			const sourceRecord = input?.sourceRecords.find((record) => String(record[primaryKey]) === decision.sourceId);

			const sourceLabel = recordLabel(sourceRecord, primaryKey, decision.sourceId);
			const resource = allResources().find((candidate) => candidate.collection === decision.collection);
			const singular = resource?.singular ?? 'record';

			if (decision.targetId === null) {
				return `${decision.collection} ${sourceLabel} → new target ${singular}`;
			}

			const targetRecord = input?.targetRecords.find((record) => String(record[primaryKey]) === decision.targetId);

			return `${decision.collection} ${sourceLabel} → existing target ${recordLabel(targetRecord, primaryKey, decision.targetId)}`;
		});

		note(lines.join('\n'), 'Identity choices');
	}

	// Identity is settled before anything is sent, and stays settled: a gate further down can still refuse
	// the push, and re-asking for the same decisions would be worse than keeping them. Say so, because this
	// writes a tracked file and the command it belongs to may yet fail.
	if (map !== reconciled.map) {
		writeIdMap(target.idMapPath, map);
		ctx.ui.info(`Identity matches saved: ${relative(ctx.cwd, target.idMapPath)}`);
	}

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
	readonly dependentCount: number;
	readonly unmatchedCount: number;
	readonly unchangedCount: number;
	readonly incomplete: readonly string[];
}

/**
 * Preview without prompting or writing. Unambiguous matches are applied in memory; ambiguous sources and
 * every record whose FK chain leads to one are excluded from the batch. The direct collisions are counted
 * as ambiguous; records waiting on those choices are counted as dependent.
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

	excludeDependents(system, excluded);

	let matchedCount = 0;
	let unmatchedCount = 0;
	let excludedCount = 0;
	const ambiguousCount = results.reduce((total, result) => total + result.ambiguous.length, 0);

	for (const result of results) {
		const dropped = excluded.get(result.collection);
		matchedCount += result.matched.filter((entry) => dropped?.has(entry.sourceId) !== true).length;
		unmatchedCount += result.unmatched.filter((sourceId) => dropped?.has(sourceId) !== true).length;
	}

	for (const dropped of excluded.values()) excludedCount += dropped.size;

	const dependentCount = excludedCount - ambiguousCount;

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
		dependentCount,
		unmatchedCount,
		unchangedCount,
		incomplete: reconciled.incomplete,
	};
}
