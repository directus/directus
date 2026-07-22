import { relative } from 'node:path';
import { isPlainObject } from 'lodash-es';
import type { ProjectConfig } from '../../kernel/config/file.js';
import { CliError } from '../../kernel/error.js';
import type { CliContext } from '../../kernel/run.js';
import { fetchRecords, fetchSnapshot, type RecordSource, type SnapshotScope } from '../../sync/api.js';
import type { Snapshot } from '../../sync/contract.js';
import { type DataCollection, writeDataFiles } from '../../sync/data-store.js';
import { normalizeInstanceUrl } from '../../sync/id-map.js';
import { resolveResources, type Resource, SELECTABLE_RESOURCES } from '../../sync/resources.js';
import { readSnapshotFiles, type WriteScope, writeSnapshotFiles } from '../../sync/store.js';
import { resolveTarget } from './resolve-target.js';

export interface PullOptions {
	readonly from: string;
	readonly collections?: string;
	readonly excludeCollections?: string;
	readonly resources?: string;
	readonly excludeResources?: string;
	readonly content?: string;
	// commander sets deps=false for --no-deps; true by default (dependency closure is opt-out).
	readonly deps: boolean;
	readonly project: string;
}

// The machine payload's `data` block: what the data export covered. `resources` lists the exported
// collection identifiers in export order; `files` is the count written (metadata.json included) and
// `removed` the stale artifacts cleaned up — mirroring the schema report's file fields. Every pull now
// exports at least the default resource set, so the block is always present, never null.
interface DataReport {
	readonly resources: string[];
	readonly collections: number;
	readonly records: number;
	readonly files: number;
	readonly removed: string[];
}

// A resolved schema scope carries both wire and store shapes plus the surfaces that must report it: the
// api scope the server narrows on, the store scope that decides which local artifacts to mirror, the
// machine payload's `scope` value, and the human line's trailing note. No scope → undefined everywhere,
// so an unscoped schema pull is byte-for-byte the pre-scope behavior.
interface ResolvedScope {
	readonly api: SnapshotScope;
	readonly write: WriteScope;
	readonly payload: { include: string[] } | { exclude: string[] };
	readonly note: string;
}

// One include/exclude scope pair, resolved from flags or config: exactly one side, or undefined when
// neither is set anywhere.
type Pair = { readonly include: string[] } | { readonly exclude: string[] } | undefined;

// The error copy for a scope pair, spelled per scope so each flag/config key is named exactly.
interface PairMessages {
	readonly bothFlags: string;
	readonly emptyInclude: string;
	readonly emptyExclude: string;
	readonly bothConfig: string;
}

function parseList(raw: string): string[] {
	return raw
		.split(',')
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0);
}

// Codepoint comparison, never localeCompare/Intl (see the schema store): the sorted content-collection
// order must not vary by machine. Written as statements rather than a nested ternary per the repo's rule.
function byCodepoint(a: string, b: string): number {
	if (a < b) return -1;
	if (a > b) return 1;
	return 0;
}

// A content collection's primary key, dug defensively out of the on-disk schema: the field entry for the
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

// Resolve one include/exclude scope pair with flag-over-config precedence, independently per scope. A CLI
// flag on either side makes the flags authoritative for the pair (config ignored); otherwise the project
// config supplies it. Include and exclude are mutually exclusive: both flags is USAGE, both config keys
// is CONFIG (naming the project). Flag lists must be non-empty; config lists are trusted as authored.
function resolvePair(
	flagInclude: string | undefined,
	flagExclude: string | undefined,
	configInclude: readonly string[] | undefined,
	configExclude: readonly string[] | undefined,
	messages: PairMessages,
): Pair {
	if (flagInclude !== undefined || flagExclude !== undefined) {
		if (flagInclude !== undefined && flagExclude !== undefined) {
			throw new CliError('USAGE', messages.bothFlags);
		}

		if (flagInclude !== undefined) {
			const include = parseList(flagInclude);
			if (include.length === 0) throw new CliError('USAGE', messages.emptyInclude);
			return { include };
		}

		if (flagExclude !== undefined) {
			const exclude = parseList(flagExclude);
			if (exclude.length === 0) throw new CliError('USAGE', messages.emptyExclude);
			return { exclude };
		}
	}

	if (configInclude !== undefined && configExclude !== undefined) {
		throw new CliError('CONFIG', messages.bothConfig);
	}

	if (configInclude !== undefined) return { include: [...configInclude] };
	if (configExclude !== undefined) return { exclude: [...configExclude] };

	return undefined;
}

// Mutual exclusivity is surfaced client-side with a clean USAGE message rather than as a server 400.
function resolveScope(options: PullOptions, projectConfig: ProjectConfig | undefined): ResolvedScope | undefined {
	const pair = resolvePair(
		options.collections,
		options.excludeCollections,
		projectConfig?.collections,
		projectConfig?.excludeCollections,
		{
			bothFlags: 'Pass --collections or --exclude-collections, not both.',
			emptyInclude: '--collections needs at least one collection name.',
			emptyExclude: '--exclude-collections needs at least one collection name.',
			bothConfig: `Project "${options.project}" sets both collections and excludeCollections.`,
		},
	);

	if (pair === undefined) return undefined;

	if ('include' in pair) {
		const include = pair.include;

		return {
			api: { include },
			write: { inScope: (name) => include.includes(name) },
			payload: { include },
			note: ` (scoped to: ${include.join(', ')})`,
		};
	}

	const exclude = pair.exclude;

	return {
		api: { exclude },
		write: { inScope: (name) => !exclude.includes(name) },
		payload: { exclude },
		note: ` (excluding: ${exclude.join(', ')})`,
	};
}

// Every selectable resource EXCEPT users: the default set a bare pull exports. Users is selectable-but-off
// (spec Q8), so a bare pull must never write accounts to disk; --resources users is the only way in.
function defaultResourceNames(): string[] {
	return SELECTABLE_RESOURCES.filter((name) => name !== 'users');
}

// The system resources this pull exports, expanded to their dependency closure. Precedence: flags over
// project config over the default set. An include list is validated by resolveResources (unknown → USAGE,
// dependent-only → USAGE naming the parent); an exclude list subtracts from the default set and every
// excluded name must itself be selectable. `deps` (opt out via --no-deps) governs closure between
// selectable resources; dependent-only children always ride with their parent regardless.
function resolveResourceSet(options: PullOptions, projectConfig: ProjectConfig | undefined): Resource[] {
	const pair = resolvePair(
		options.resources,
		options.excludeResources,
		projectConfig?.resources,
		projectConfig?.excludeResources,
		{
			bothFlags: 'Pass --resources or --exclude-resources, not both.',
			emptyInclude: '--resources needs at least one resource name.',
			emptyExclude: '--exclude-resources needs at least one resource name.',
			bothConfig: `Project "${options.project}" sets both resources and excludeResources.`,
		},
	);

	const deps = options.deps;

	if (pair === undefined) return resolveResources(defaultResourceNames(), { deps });

	if ('include' in pair) return resolveResources(pair.include, { deps });

	const excluded = pair.exclude;

	for (const name of excluded) {
		if (!SELECTABLE_RESOURCES.includes(name)) {
			throw new CliError('USAGE', `Cannot exclude "${name}": not a selectable resource.`, {
				hint: `Selectable resources: ${SELECTABLE_RESOURCES.join(', ')}.`,
			});
		}
	}

	return resolveResources(
		defaultResourceNames().filter((name) => !excluded.includes(name)),
		{ deps },
	);
}

// The raw content collection names, flags over config over none. Parsed and empty-checked here (before
// any fetch) so a bare or all-whitespace --content fails fast; membership is validated later against the
// pulled schema, once it is on disk.
function contentNames(options: PullOptions, projectConfig: ProjectConfig | undefined): string[] {
	if (options.content !== undefined) {
		const list = parseList(options.content);
		if (list.length === 0) throw new CliError('USAGE', '--content needs at least one collection name.');
		return list;
	}

	if (projectConfig?.content !== undefined) return [...projectConfig.content];

	return [];
}

// Expand content names to record sources against the just-written schema. A name that is a resource-graph
// name is a config resource in disguise and routes to --resources; every other name is a user collection
// exported from /items/<name>, and must exist in the pulled schema (data follows schema) with a
// discoverable primary key. Order is codepoint-sorted, deduped by collection.
function resolveContentSources(names: string[], schemaDir: string): RecordSource[] {
	if (names.length === 0) return [];

	// The whole graph's CLI names, derived from the frozen module rather than hardcoded here.
	const graphNames = new Set(resolveResources([...SELECTABLE_RESOURCES]).map((resource) => resource.name));

	// Read the schema back from disk (not the fetched snapshot) so a content collection's data can only be
	// exported for schema that is actually committed.
	const snapshot = readSnapshotFiles(schemaDir);

	const seen = new Set<string>();
	const sources: RecordSource[] = [];

	for (const collection of [...new Set(names)].sort(byCodepoint)) {
		if (graphNames.has(collection)) {
			throw new CliError('USAGE', `"${collection}" is a config resource, not content.`, {
				hint: 'Export config resources with --resources, not --content.',
			});
		}

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

	return sources;
}

// Delete a resource's strip + alias field names from every record before it is written. A deny-list (not
// an allow-list) is deliberate: fetchRecords pulls fields=*, so a server version that adds a column keeps
// flowing through, where an allow-list would silently drop it. Sensitive columns (users.token/password)
// therefore never touch disk, and alias views (roles.users, flows.operations) — whose linkage already
// ships as real child rows — are dropped rather than duplicated. Records are freshly parsed and owned, so
// deleting in place is safe. Content records are never passed here.
function stripSystemFields(records: Record<string, unknown>[], resource: Resource): Record<string, unknown>[] {
	const drop = [...resource.strip, ...resource.aliases];

	if (drop.length === 0) return records;

	for (const record of records) {
		for (const field of drop) delete record[field];
	}

	return records;
}

export async function pull(options: PullOptions, ctx: CliContext): Promise<void> {
	const { url, credential, schemaDir, dataDir, project, projectConfig } = resolveTarget(
		options.from,
		ctx,
		options.project,
	);

	const scope = resolveScope(options, projectConfig);

	// Resolve the resource selection and parse the content names before the fetch so a flag/config error
	// (mutual exclusivity, an unknown resource, an empty list) fails fast, before any network call. Content
	// names expand to record sources only after the schema write, since a content collection must exist in
	// the schema this pull just committed.
	const resources = resolveResourceSet(options, projectConfig);
	const contentNamesList = contentNames(options, projectConfig);

	const snapshot = await fetchSnapshot(credential, scope?.api);

	const result = writeSnapshotFiles(schemaDir, snapshot, scope?.write);
	const relativeDir = relative(ctx.cwd, schemaDir);
	const collections = snapshot.collections.length;
	const removed = result.removed.length;

	const removedNote = removed > 0 ? ` Removed ${removed} stale ${removed === 1 ? 'file' : 'files'}.` : '';

	const contentSources = resolveContentSources(contentNamesList, schemaDir);

	const includesUsers = new Set(resources.map((resource) => resource.name)).has('users');

	const dataCollections: DataCollection[] = [];

	// System resources first, in dependency order: each has its sensitive/alias fields stripped and, when
	// users are out of scope, its user-attached access rows dropped. Content collections follow,
	// codepoint-sorted, written verbatim — stripping and the access filter never touch user records.
	for (const resource of resources) {
		let rows = await fetchRecords(credential, {
			collection: resource.collection,
			endpoint: resource.endpoint,
			primaryKey: resource.primaryKey,
			singleton: resource.singleton,
		});

		rows = stripSystemFields(rows, resource);

		if (resource.collection === 'directus_access' && !includesUsers) {
			// User-attached access rows reference users that are out of scope; importing them fails the
			// missing-FK check (INVALID_FOREIGN_KEY) and deleting them target-side under mirror is the
			// directus-sync #148 data-loss class. Ship only the null-user (role/policy-level) grants.
			rows = rows.filter((record) => record['user'] === null || record['user'] === undefined);
		}

		dataCollections.push({ collection: resource.collection, primaryKey: resource.primaryKey, records: rows });
	}

	for (const source of contentSources) {
		dataCollections.push({
			collection: source.collection,
			primaryKey: source.primaryKey,
			records: await fetchRecords(credential, source),
		});
	}

	// Record the normalized source URL so a later push can find this data's source→target ID-map bucket
	// without re-deriving (and possibly mis-guessing) which instance produced the records.
	const dataResult = writeDataFiles(dataDir, dataCollections, normalizeInstanceUrl(url));
	const records = dataCollections.reduce((total, entry) => total + entry.records.length, 0);
	const dataDirRelative = relative(ctx.cwd, dataDir);
	const collectionCount = dataCollections.length;

	const data: DataReport = {
		resources: dataCollections.map((entry) => entry.collection),
		collections: collectionCount,
		records,
		files: dataResult.written.length,
		removed: dataResult.removed,
	};

	const dataSentence = ` Pulled ${records} data ${records === 1 ? 'record' : 'records'} across ${collectionCount} ${collectionCount === 1 ? 'collection' : 'collections'} → ${dataDirRelative}.`;

	ctx.ui.success(
		`Pulled ${collections} ${collections === 1 ? 'collection' : 'collections'} from ${url} → ${relativeDir}.${removedNote}${scope?.note ?? ''}${dataSentence}`,
	);

	ctx.ui.data({
		kind: 'PullReport',
		formatVersion: 1,
		ok: true,
		source: url,
		profile: options.from,
		project,
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
		// The resolved content collections, empty when none were requested.
		content: contentSources.map((source) => source.collection),
		// The data export summary — always an object now, since every pull exports the resource set.
		data,
	});
}
