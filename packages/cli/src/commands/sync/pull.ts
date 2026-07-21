import { relative } from 'node:path';
import { isPlainObject } from 'lodash-es';
import { CliError } from '../../kernel/error.js';
import type { CliContext } from '../../kernel/run.js';
import { fetchRecords, fetchSnapshot, type RecordSource, type SnapshotScope } from '../../sync/api.js';
import type { Snapshot } from '../../sync/contract.js';
import { type DataCollection, writeDataFiles } from '../../sync/data-store.js';
import { resolveResources, SELECTABLE_RESOURCES } from '../../sync/resources.js';
import { readSnapshotFiles, type WriteScope, writeSnapshotFiles } from '../../sync/store.js';
import { resolveTarget } from './resolve-target.js';

export interface PullOptions {
	readonly from: string;
	readonly collections?: string;
	readonly excludeCollections?: string;
	readonly data?: string;
}

// The machine payload's `data` block: what the data export covered. `resources` lists the exported
// collection identifiers in export order; `files` is the count written (metadata.json included) and
// `removed` the stale artifacts cleaned up — mirroring the schema report's file fields.
interface DataReport {
	readonly resources: string[];
	readonly collections: number;
	readonly records: number;
	readonly files: number;
	readonly removed: string[];
}

// A resolved scope carries both wire and store shapes plus the surfaces that must report it: the
// api scope the server narrows on, the store scope that decides which local artifacts to mirror,
// the machine payload's `scope` value, and the human line's trailing note. No scope → undefined
// everywhere, so an unscoped pull is byte-for-byte the pre-scope behavior.
interface ResolvedScope {
	readonly api: SnapshotScope;
	readonly write: WriteScope;
	readonly payload: { include: string[] } | { exclude: string[] };
	readonly note: string;
}

function parseList(raw: string): string[] {
	return raw
		.split(',')
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0);
}

// Mutual exclusivity is surfaced client-side with a clean USAGE message rather than as a server 400,
// and an empty list (all-whitespace or bare flag) is refused naming the flag the operator passed.
function resolveScope(options: PullOptions): ResolvedScope | undefined {
	if (options.collections !== undefined && options.excludeCollections !== undefined) {
		throw new CliError('USAGE', 'Pass --collections or --exclude-collections, not both.');
	}

	if (options.collections !== undefined) {
		const include = parseList(options.collections);

		if (include.length === 0) {
			throw new CliError('USAGE', '--collections needs at least one collection name.');
		}

		return {
			api: { include },
			write: { inScope: (name) => include.includes(name) },
			payload: { include },
			note: ` (scoped to: ${include.join(', ')})`,
		};
	}

	if (options.excludeCollections !== undefined) {
		const exclude = parseList(options.excludeCollections);

		if (exclude.length === 0) {
			throw new CliError('USAGE', '--exclude-collections needs at least one collection name.');
		}

		return {
			api: { exclude },
			write: { inScope: (name) => !exclude.includes(name) },
			payload: { exclude },
			note: ` (excluding: ${exclude.join(', ')})`,
		};
	}

	return undefined;
}

// Codepoint comparison, never localeCompare/Intl (see the schema store): the sorted user-collection order
// must not vary by machine. Written as statements rather than a nested ternary per the repo's rule.
function byCodepoint(a: string, b: string): number {
	if (a < b) return -1;
	if (a > b) return 1;
	return 0;
}

// A user collection's primary key, dug defensively out of the on-disk schema: the field entry for the
// collection whose loose `schema.is_primary_key` is true. Fields are verbatim loose objects, so every
// access is guarded. Both buckets are searched because an ordinary collection's id can live in either
// (the server marks an indexed id as a system field). None found is a STATE error naming the collection —
// a collection with no discoverable primary key cannot be exported deterministically.
function primaryKeyOf(snapshot: Snapshot, collection: string): string {
	for (const entry of [...snapshot.fields, ...snapshot.systemFields]) {
		if (entry.collection !== collection) continue;

		const schema = entry['schema'];

		if (isPlainObject(schema) && (schema as Record<string, unknown>)['is_primary_key'] === true) {
			return entry.field;
		}
	}

	throw new CliError('STATE', `Collection "${collection}" has no field marked as a primary key.`, {
		hint: 'A synced collection needs a primary key to order and reconcile its records.',
	});
}

// Resolve the --data selection to an ordered, deduped set of record sources. Names are matched against the
// resource graph first: a graph name (selectable OR dependent-only) rides through resolveResources, which
// expands a selectable name to its must-pull closure and throws the right USAGE error for a dependent-only
// one (e.g. panels → select dashboards). Every other name is a user collection, exported from
// /items/<name>; it must already exist in the pulled schema (data follows schema) and carry a discoverable
// primary key. Order is resolveResources order for resources, then user collections codepoint-sorted; the
// set is deduped by collection.
function resolveDataSources(names: string[], schemaDir: string): RecordSource[] {
	// resolveResources over every selectable name yields the whole graph — dependent-only children
	// included — so graph membership is derived from the frozen module, never hardcoded here.
	const graphNames = new Set(resolveResources([...SELECTABLE_RESOURCES]).map((resource) => resource.name));

	const requestedResources: string[] = [];
	const userCollections: string[] = [];

	for (const name of names) {
		if (graphNames.has(name)) requestedResources.push(name);
		else userCollections.push(name);
	}

	const seen = new Set<string>();
	const sources: RecordSource[] = [];

	for (const resource of resolveResources(requestedResources)) {
		if (seen.has(resource.collection)) continue;

		seen.add(resource.collection);

		sources.push({
			collection: resource.collection,
			endpoint: resource.endpoint,
			primaryKey: resource.primaryKey,
			singleton: resource.singleton,
		});
	}

	if (userCollections.length > 0) {
		// Read the schema back from disk (not the fetched snapshot) so a user collection's data can only be
		// exported for schema that is actually committed.
		const snapshot = readSnapshotFiles(schemaDir);

		for (const collection of [...new Set(userCollections)].sort(byCodepoint)) {
			if (seen.has(collection)) continue;

			if (!snapshot.collections.some((entry) => entry.collection === collection)) {
				throw new CliError('USAGE', `Collection "${collection}" is not in the pulled schema.`, {
					hint: `Data follows schema — pull ${collection}'s schema first, e.g. --collections ${collection}.`,
				});
			}

			seen.add(collection);

			sources.push({
				collection,
				endpoint: `/items/${collection}`,
				primaryKey: primaryKeyOf(snapshot, collection),
				singleton: false,
			});
		}
	}

	return sources;
}

export async function pull(options: PullOptions, ctx: CliContext): Promise<void> {
	const { url, credential, schemaDir, dataDir } = resolveTarget(options.from, ctx);

	const scope = resolveScope(options);

	// Parse --data before the fetch so an empty selection (bare flag or all-whitespace) fails fast,
	// naming the flag, before any network call.
	const dataNames = options.data === undefined ? undefined : parseList(options.data);

	if (dataNames !== undefined && dataNames.length === 0) {
		throw new CliError('USAGE', '--data needs at least one resource or collection name.');
	}

	const snapshot = await fetchSnapshot(credential, scope?.api);

	const result = writeSnapshotFiles(schemaDir, snapshot, scope?.write);
	const relativeDir = relative(ctx.cwd, schemaDir);
	const collections = snapshot.collections.length;
	const removed = result.removed.length;

	const removedNote = removed > 0 ? ` Removed ${removed} stale ${removed === 1 ? 'file' : 'files'}.` : '';

	// Data export runs only when --data was passed, and only after the schema write so a user collection's
	// records follow the schema just committed. `data` stays null otherwise (the payload key is always
	// present) and the human line gains no second sentence.
	let data: DataReport | null = null;
	let dataSentence = '';

	if (dataNames !== undefined) {
		const sources = resolveDataSources(dataNames, schemaDir);

		const dataCollections: DataCollection[] = [];

		for (const source of sources) {
			dataCollections.push({
				collection: source.collection,
				primaryKey: source.primaryKey,
				records: await fetchRecords(credential, source),
			});
		}

		const dataResult = writeDataFiles(dataDir, dataCollections);
		const records = dataCollections.reduce((total, entry) => total + entry.records.length, 0);
		const dataDirRelative = relative(ctx.cwd, dataDir);
		const collectionCount = dataCollections.length;

		data = {
			resources: sources.map((source) => source.collection),
			collections: collectionCount,
			records,
			files: dataResult.written.length,
			removed: dataResult.removed,
		};

		dataSentence = ` Pulled ${records} data ${records === 1 ? 'record' : 'records'} across ${collectionCount} ${collectionCount === 1 ? 'collection' : 'collections'} → ${dataDirRelative}.`;
	}

	ctx.ui.success(
		`Pulled ${collections} ${collections === 1 ? 'collection' : 'collections'} from ${url} → ${relativeDir}.${removedNote}${scope?.note ?? ''}${dataSentence}`,
	);

	ctx.ui.data({
		kind: 'PullReport',
		formatVersion: 1,
		ok: true,
		source: url,
		profile: options.from,
		dir: relativeDir,
		collections,
		fields: snapshot.fields.length,
		systemFields: snapshot.systemFields.length,
		relations: snapshot.relations.length,
		files: result.written.length,
		removed: result.removed,
		// Always present so a consumer never has to guess whether a pull was scoped: the scope the
		// server narrowed on, or null for a full pull.
		scope: scope?.payload ?? null,
		// Always present so a consumer never has to guess whether data was exported: the export summary,
		// or null when --data was absent.
		data,
	});
}
