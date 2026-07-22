import { relative } from 'node:path';
import { isPlainObject } from 'lodash-es';
import type { ProjectConfig } from '../../kernel/config/file.js';
import { CliError } from '../../kernel/error.js';
import type { CliContext } from '../../kernel/run.js';
import { count } from '../../kernel/text.js';
import { fetchRecords, fetchSnapshot, type RecordSource, type SnapshotScope } from '../../sync/api.js';
import { byCodepoint } from '../../sync/codepoint.js';
import type { Snapshot } from '../../sync/contract.js';
import { type DataCollection, writeDataFiles } from '../../sync/data-store.js';
import { normalizeInstanceUrl } from '../../sync/id-map.js';
import { allResources, resolveResources, type Resource, SELECTABLE_RESOURCES } from '../../sync/resources.js';
import { type WriteScope, writeSnapshotFiles } from '../../sync/store.js';
import { resolveTarget } from './resolve-target.js';

// The selectable resource names, as commander camelCases each --<resource>/--no-<resource> flag onto opts().
type SelectableResourceFlag = 'dashboards' | 'flows' | 'policies' | 'roles' | 'settings' | 'translations' | 'users';

export type PullOptions = {
	readonly from: string;
	readonly collections?: readonly string[];
	readonly excludeCollections?: readonly string[];
	readonly all?: boolean;
	readonly content?: readonly string[];
	readonly deps: boolean;
	readonly project: string;
} & Partial<Record<SelectableResourceFlag, boolean>>;

interface PullDataReport {
	readonly resources: string[];
	readonly collections: number;
	readonly records: number;
	readonly files: number;
	readonly removed: string[];
}

interface ResolvedScope {
	readonly api: SnapshotScope;
	readonly write: WriteScope;
	readonly payload: { include: string[] } | { exclude: string[] };
	readonly note: string;
}

type Pair = { readonly include: string[] } | { readonly exclude: string[] } | undefined;

interface PairMessages {
	readonly bothFlags: string;
	readonly emptyInclude: string;
	readonly emptyExclude: string;
	readonly bothConfig: string;
}

// Ordinary collection primary keys can appear in fields or systemFields; the loose snapshot values must
// be narrowed before use.
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

// The field specials whose values cannot round-trip through an export: the server masks conceal and
// encrypt reads to '**********' (api payload.ts), and re-hashes whatever a hash field is WRITTEN with —
// so exporting them commits masks, and pushing would overwrite the target's real secret with the mask
// (or corrupt its hash by hashing the hash).
const NON_ROUNDTRIP_SPECIALS = new Set(['conceal', 'encrypt', 'hash']);

function nonRoundtripFields(snapshot: Snapshot, collection: string): string[] {
	const fields: string[] = [];

	for (const entry of snapshot.fields) {
		if (entry.collection !== collection) continue;

		const meta = entry['meta'];
		const special = isPlainObject(meta) ? (meta as Record<string, unknown>)['special'] : undefined;

		if (
			Array.isArray(special) &&
			special.some((value) => typeof value === 'string' && NON_ROUNDTRIP_SPECIALS.has(value))
		) {
			fields.push(entry.field);
		}
	}

	return fields;
}

// Any CLI scope flag overrides the configured pair; include and exclude remain mutually exclusive.
function resolvePair(
	flagInclude: readonly string[] | undefined,
	flagExclude: readonly string[] | undefined,
	configInclude: readonly string[] | undefined,
	configExclude: readonly string[] | undefined,
	messages: PairMessages,
): Pair {
	if (flagInclude !== undefined || flagExclude !== undefined) {
		if (flagInclude !== undefined && flagExclude !== undefined) {
			throw new CliError('USAGE', messages.bothFlags);
		}

		if (flagInclude !== undefined) {
			if (flagInclude.length === 0) throw new CliError('USAGE', messages.emptyInclude);
			return { include: [...flagInclude] };
		}

		if (flagExclude !== undefined) {
			if (flagExclude.length === 0) throw new CliError('USAGE', messages.emptyExclude);
			return { exclude: [...flagExclude] };
		}
	}

	if (configInclude !== undefined && configExclude !== undefined) {
		throw new CliError('CONFIG', messages.bothConfig);
	}

	if (configInclude !== undefined) return { include: [...configInclude] };
	if (configExclude !== undefined) return { exclude: [...configExclude] };

	return undefined;
}

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

// Users require explicit selection so a bare pull never commits accounts.
const DEFAULT_RESOURCE_NAMES = SELECTABLE_RESOURCES.filter((name) => name !== 'users');

// Resolve boolean flags over --all over project config over defaults, then expand the selected closure.
function resolveResourceSet(options: PullOptions, projectConfig: ProjectConfig | undefined): Resource[] {
	// Commander only defines the negative flag, so options.deps is false exactly when --no-deps was
	// passed; otherwise the project config's deps (when set) decides, defaulting to the full closure.
	const deps = options.deps === false ? false : (projectConfig?.deps ?? true);

	const positives = SELECTABLE_RESOURCES.filter((name) => options[name as SelectableResourceFlag] === true);
	const negatives = SELECTABLE_RESOURCES.filter((name) => options[name as SelectableResourceFlag] === false);

	// Any boolean flag or --all overrides project config wholesale — no merging.
	if (options.all === true || positives.length > 0 || negatives.length > 0) {
		if (options.all === true && positives.length > 0) {
			throw new CliError(
				'USAGE',
				'--all already includes every resource; drop the named resources or subtract with --no-<resource>.',
			);
		}

		if (positives.length > 0 && negatives.length > 0) {
			throw new CliError('USAGE', 'Name the resources you want, or subtract them with --no-<resource> — not both.');
		}

		if (options.all === true) {
			return resolveResources(
				SELECTABLE_RESOURCES.filter((name) => !negatives.includes(name)),
				{ deps },
			);
		}

		if (positives.length > 0) return resolveResources(positives, { deps });

		return resolveResources(
			DEFAULT_RESOURCE_NAMES.filter((name) => !negatives.includes(name)),
			{ deps },
		);
	}

	const configInclude = projectConfig?.resources;
	const configExclude = projectConfig?.excludeResources;

	if (configInclude !== undefined && configExclude !== undefined) {
		throw new CliError('CONFIG', `Project "${options.project}" sets both resources and excludeResources.`);
	}

	if (configInclude !== undefined) return resolveResources([...configInclude], { deps });

	if (configExclude !== undefined) {
		for (const name of configExclude) {
			if (!SELECTABLE_RESOURCES.includes(name)) {
				throw new CliError('USAGE', `Cannot exclude "${name}": not a selectable resource.`, {
					hint: `Selectable resources: ${SELECTABLE_RESOURCES.join(', ')}.`,
				});
			}
		}

		return resolveResources(
			DEFAULT_RESOURCE_NAMES.filter((name) => !configExclude.includes(name)),
			{ deps },
		);
	}

	return resolveResources(DEFAULT_RESOURCE_NAMES, { deps });
}

// Parse content names before fetching; validate membership against the fetched snapshot.
function contentNames(options: PullOptions, projectConfig: ProjectConfig | undefined): string[] {
	if (options.content !== undefined) {
		if (options.content.length === 0) throw new CliError('USAGE', '--content needs at least one collection name.');
		return [...options.content];
	}

	if (projectConfig?.content !== undefined) return [...projectConfig.content];

	return [];
}

// Content sources must exist in the fetched schema and have a discoverable primary key.
function resolveContentSources(names: string[], snapshot: Snapshot): RecordSource[] {
	if (names.length === 0) return [];

	const graphNames = new Set(allResources().map((resource) => resource.name));

	const sources: RecordSource[] = [];

	for (const collection of [...new Set(names)].sort(byCodepoint)) {
		if (graphNames.has(collection)) {
			throw new CliError('USAGE', `"${collection}" is a config resource, not content.`, {
				hint: 'Export config resources with their --<resource> flag, not --content.',
			});
		}

		if (!snapshot.collections.some((entry) => entry.collection === collection)) {
			throw new CliError('USAGE', `Collection "${collection}" is not in the pulled schema.`, {
				hint: `Data follows schema — pull ${collection}'s schema first, e.g. --collections ${collection}.`,
			});
		}

		sources.push({
			collection,
			endpoint: `/items/${collection}`,
			primaryKey: primaryKeyOf(snapshot, collection),
			singleton: false,
		});
	}

	return sources;
}

// A deny-list preserves new server fields by default while removing secrets, external FKs, and alias views.
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

	// Fail invalid resource/content options before the first network request.
	const resources = resolveResourceSet(options, projectConfig);
	const contentNamesList = contentNames(options, projectConfig);

	const snapshot = await fetchSnapshot(credential, scope?.api);

	const contentSources = resolveContentSources(contentNamesList, snapshot);

	const includesUsers = resources.some((resource) => resource.name === 'users');

	const dataCollections: DataCollection[] = [];

	for (const resource of resources) {
		let rows = await fetchRecords(credential, {
			collection: resource.collection,
			endpoint: resource.endpoint,
			primaryKey: resource.primaryKey,
			singleton: resource.singleton,
			drop: resource.drop,
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
		const rows = await fetchRecords(credential, source);

		// Content is otherwise exported verbatim, but conceal/encrypt/hash fields cannot round-trip (see
		// NON_ROUNDTRIP_SPECIALS): committing them would land masks in git and a later push would overwrite
		// the target's real secrets with those masks. Strip them and say so — an absent field is never
		// written by the import, so the target keeps its own values.
		const masked = nonRoundtripFields(snapshot, source.collection);

		if (masked.length > 0) {
			for (const row of rows) {
				for (const field of masked) delete row[field];
			}

			ctx.ui.warn(
				`content ${source.collection}: exported without ${masked.join(', ')} — conceal/encrypt/hash values cannot round-trip.`,
			);
		}

		dataCollections.push({ collection: source.collection, primaryKey: source.primaryKey, records: rows });
	}

	const result = writeSnapshotFiles(schemaDir, snapshot, scope?.write);
	const relativeDir = relative(ctx.cwd, schemaDir);
	const collections = snapshot.collections.length;
	const removed = result.removed.length;

	// The source URL selects the correct source→target ID-map bucket during push.
	const dataResult = writeDataFiles(dataDir, dataCollections, normalizeInstanceUrl(url));
	const records = dataCollections.reduce((total, entry) => total + entry.records.length, 0);
	const dataDirRelative = relative(ctx.cwd, dataDir);
	const collectionCount = dataCollections.length;

	const data: PullDataReport = {
		resources: dataCollections.map((entry) => entry.collection),
		collections: collectionCount,
		records,
		files: dataResult.written.length,
		removed: dataResult.removed,
	};

	// One line per axis so "collection" never means two things in one sentence: Schema is structure for
	// every collection, Resources are directus_* config records, Content is records of user collections.
	if (!ctx.ui.json) {
		const contentNamesSet = new Set(contentSources.map((source) => source.collection));
		const resourceEntries = dataCollections.filter((entry) => !contentNamesSet.has(entry.collection));
		const contentEntries = dataCollections.filter((entry) => contentNamesSet.has(entry.collection));
		const resourceRecords = resourceEntries.reduce((total, entry) => total + entry.records.length, 0);
		const contentRecords = contentEntries.reduce((total, entry) => total + entry.records.length, 0);

		const schemaNote = `${scope?.note ?? ''}${removed > 0 ? ` (removed ${count(removed, 'stale file')})` : ''}`;

		const dataNote =
			dataResult.removed.length > 0 ? ` (removed ${count(dataResult.removed.length, 'stale file')})` : '';

		ctx.ui.success(`Pulled from ${options.from} — ${url}`);
		ctx.ui.print(`  Schema     ${count(collections, 'collection')} → ${relativeDir}${schemaNote}`);

		ctx.ui.print(
			`  Resources  ${count(resourceRecords, 'record')} in ${count(resourceEntries.length, 'resource')} → ${dataDirRelative}${dataNote}`,
		);

		ctx.ui.print(
			contentEntries.length > 0
				? `  Content    ${count(contentRecords, 'record')} in ${count(contentEntries.length, 'collection')} → ${dataDirRelative}`
				: '  Content    none — add --content <collections> to export records',
		);
	}

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
		scope: scope?.payload ?? null,
		content: contentSources.map((source) => source.collection),
		data,
	});
}
