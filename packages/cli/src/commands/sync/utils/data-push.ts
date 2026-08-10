import { relative } from 'node:path';
import { note, select } from '@clack/prompts';
import type { SyncMode } from '../../../kernel/config/mode.js';
import { fetchQueryLimitMax } from '../../../kernel/connection.js';
import { CliError } from '../../../kernel/error.js';
import { ask } from '../../../kernel/prompt.js';
import type { CliContext } from '../../../kernel/run.js';
import { maybePluralize } from '../../../kernel/text.js';
import { fetchRecords } from './api.js';
import { assembleBatch, type SystemSent, type UnchangedRows } from './batch.js';
import { collisionLines, differenceHint, itemUiUrl, recordLabel, scalar } from './collision-copy.js';
import type { ImportBatchResult, ImportCollectionData } from './contract.js';
import { readDataFiles } from './data-store.js';
import { dependentCountOf, excludeDependents } from './dependents.js';
import { type IdMap, mappingsFor, normalizeInstanceUrl, readIdMap, withMappings, writeIdMap } from './id-map.js';
import { type CollectionReconcile, reconcileCollections, type ReconcileInput } from './reconcile.js';
import type { Target } from './resolve-target.js';
import { allResources } from './resources.js';
import { partitionCollections, type SystemCollection } from './system-collections.js';

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

// Parents first (hence the reverse), so child natural keys translate their FKs through earlier matches.
// Every target collection is fetched: add-mode identity checks cover resources without natural keys too.
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

		// Dependents need no decision of their own, so the ambiguity count alone understates what is held back.
		const dependents = dependentCountOf(system, ambiguities);

		const held =
			dependents === 0
				? ''
				: `; ${maybePluralize(dependents, 'record')} ${dependents === 1 ? 'depends' : 'depend'} on ${ambiguities.length === 1 ? 'that choice' : 'those choices'}`;

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

	const queryMax = await fetchQueryLimitMax(target.credential);

	const { inputs, results, targets } = await reconcileSystem(
		system,
		target,
		mappingsFor(map, { sourceUrl: source, targetUrl }),
		queryMax,
	);

	return { source, targetUrl, system, map, incomplete, inputs, results, targets };
}

/** Settles the IDs only the server could supply; `prepareDataPush` already settled which record is which. */
export function recordImportedIds(dataResult: DataPushPlan, importResult: ImportBatchResult, ctx: CliContext): void {
	let map = dataResult.map;

	const unmapped: { collection: string; sourceId: string; sentPk: string; updatedExisting: boolean }[] = [];

	for (const { collection, records } of dataResult.systemSent) {
		const result = importResult.collections[collection];
		const entries: Record<string, string> = {};

		for (const { sourceId, sentPk, temporary } of records) {
			const finalPk = result?.mapped?.[sentPk];

			if (finalPk !== undefined) {
				entries[sourceId] = String(finalPk);
				continue;
			}

			// A temporary key's only meaning is its `mapped` entry; the key itself names no target record.
			if (temporary) {
				unmapped.push({
					collection,
					sourceId,
					sentPk,
					updatedExisting: (result?.existing ?? []).some((pk) => String(pk) === sentPk),
				});

				continue;
			}

			entries[sourceId] = sentPk;
		}

		map = withMappings(map, { sourceUrl: dataResult.source, targetUrl: dataResult.target }, collection, entries);
	}

	// The resolved mappings are real whatever else went wrong, so record them before refusing the rest.
	if (map !== dataResult.map) {
		writeIdMap(dataResult.idMapPath, map);
		ctx.ui.info(`ID map updated: ${relative(ctx.cwd, dataResult.idMapPath)}`);
	}

	if (unmapped.length > 0) {
		const lines = unmapped.map((miss) =>
			miss.updatedExisting
				? `${miss.collection}: source ${miss.sourceId} — temporary key ${miss.sentPk} matched and updated an existing target record`
				: `${miss.collection}: source ${miss.sourceId} — temporary key ${miss.sentPk} came back unmapped`,
		);

		throw new CliError(
			'STATE',
			`The import response left ${maybePluralize(unmapped.length, 'temporary key')} unmapped, so the ID map has no entry for ${unmapped.length === 1 ? 'that record' : 'those records'}.\n  ${lines.join('\n  ')}`,
			{
				hint: unmapped.some((miss) => miss.updatedExisting)
					? 'A target record already used a temporary key — inspect those target records before pushing again.'
					: 'The push itself was applied. If the target Directus predates batch import key remapping, upgrade it; otherwise the next push re-matches the created records by natural key.',
			},
		);
	}
}

/** An answered ambiguity reruns reconciliation, so newly translatable child keys never import twice. */
export async function prepareDataPush(
	target: Target,
	mode: SyncMode,
	ctx: CliContext,
): Promise<DataPushPlan | undefined> {
	const reconciled = await readAndReconcile(target);

	if (reconciled === undefined) return undefined;

	const { source, targetUrl, system, inputs, targets } = reconciled;

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
			map = withMappings(map, { sourceUrl: source, targetUrl }, collection, entries);
		}

		if (!resolved.resolvedExisting) break;

		const remaining = inputs.map((input) => ({
			...input,
			sourceRecords: input.sourceRecords.filter(
				(record) => !decided.get(input.collection)?.has(String(record[input.primaryKey])),
			),
		}));

		results = reconcileCollections(remaining, mappingsFor(map, { sourceUrl: source, targetUrl }));
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

	// Identity stays settled even if a gate below refuses the push; re-asking would be worse. Announced
	// because it writes a tracked file and the push may still fail.
	if (map !== reconciled.map) {
		writeIdMap(target.idMapPath, map);
		ctx.ui.info(`Identity matches saved: ${relative(ctx.cwd, target.idMapPath)}`);
	}

	const { batch, systemSent, unchanged, records } = assembleBatch(
		system,
		mappingsFor(map, { sourceUrl: source, targetUrl }),
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

export interface DataPreviewPlan {
	readonly source: string;
	readonly batch: ImportCollectionData[];
	readonly systemSent: readonly SystemSent[];
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
 * Never prompts or writes. Unambiguous matches apply in memory; ambiguous sources and every record whose
 * FK chain leads to one leave the batch, counted as ambiguous and dependent respectively.
 */
export async function previewData(target: Target, mode: SyncMode): Promise<DataPreviewPlan | undefined> {
	const reconciled = await readAndReconcile(target);

	if (reconciled === undefined) return undefined;

	const { source, targetUrl, system, results, targets } = reconciled;

	let map = reconciled.map;
	const excluded = new Map<string, Set<string>>();

	for (const result of results) {
		if (result.ambiguous.length > 0) {
			excluded.set(result.collection, new Set(result.ambiguous.map((entry) => entry.sourceId)));
		}

		if (result.matched.length === 0) continue;

		map = withMappings(map, { sourceUrl: source, targetUrl }, result.collection, matchedEntries(result));
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

	const { batch, systemSent, unchanged, records } = assembleBatch(
		previewSystem,
		mappingsFor(map, { sourceUrl: source, targetUrl }),
		mode,
		targets,
	);

	let unchangedCount = 0;
	for (const set of unchanged.values()) unchangedCount += set.size;

	return {
		source,
		batch,
		systemSent,
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
