import { relative } from 'node:path';
import type { ProjectConfig } from '../../kernel/config/file.js';
import {
	fetchCustomPermissionRulesEntitled,
	fetchQueryLimitMax,
	fetchTotalCount,
	refreshSessionIfNeeded,
} from '../../kernel/connection.js';
import { CliError } from '../../kernel/error.js';
import type { CliContext } from '../../kernel/run.js';
import { count } from '../../kernel/text.js';
import {
	fetchFields,
	fetchRecords,
	fetchSnapshot,
	type FieldCatalogEntry,
	type SnapshotScope,
} from '../../sync/api.js';
import {
	assertDataSource,
	type DataCollection,
	hasCommittedCollection,
	writeDataFiles,
} from '../../sync/data-store.js';
import { normalizeInstanceUrl } from '../../sync/id-map.js';
import { findOutOfScopeReferences, formatOutOfScopeReferences } from '../../sync/references.js';
import { resolveResources, type Resource, SELECTABLE_RESOURCES } from '../../sync/resources.js';
import { readSnapshotFiles, type WriteScope, writeSnapshotFiles } from '../../sync/store.js';
import { resolveTarget } from './resolve-target.js';

// The selectable resource names, as commander camelCases each --<resource>/--no-<resource> flag onto opts().
type SelectableResourceFlag =
	| 'dashboards'
	| 'flows'
	| 'folders'
	| 'policies'
	| 'roles'
	| 'settings'
	| 'translations'
	| 'users';

export type PullOptions = {
	readonly from: string;
	readonly collections?: readonly string[];
	readonly excludeCollections?: readonly string[];
	readonly all?: boolean;
	readonly deps: boolean;
	/** Commander only defines --no-schema, so false means the flag was passed; true is the default. */
	readonly schema?: boolean;
	readonly project: string;
} & Partial<Record<SelectableResourceFlag, boolean>>;

interface PullDataReport {
	readonly resources: string[];
	readonly collections: number;
	readonly records: number;
	readonly files: number;
	readonly removed: string[];
	readonly incomplete: string[];
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

// Users and translations require explicit selection. A bare pull never commits accounts (users), and it
// omits translations because the server's translations updateMany throws "Duplicate key and language
// combination" on any mirror push of them (api services/translations.ts) — shipping them by default would
// break an otherwise clean mirror. Opt in with --translations (or --all); merge and add are unaffected.
const DEFAULT_RESOURCE_NAMES = SELECTABLE_RESOURCES.filter((name) => name !== 'users' && name !== 'translations');

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

// Word a permissions shortfall by what the license entitlement actually says, not by assumption. The
// total_count probe proves the export is short; the entitlement (when readable) proves WHY, so we never
// blame licensing for a shortfall we couldn't confirm, and we flag a licensed shortfall as unexpected.
function permissionsShortfallWarning(
	name: string,
	exported: number,
	total: number,
	entitled: boolean | undefined,
): string {
	const base = `${name}: exported ${exported} of ${total} rows — the export is incomplete: merge and add pushes stay safe, mirror pushes will refuse it.`;

	if (entitled === false) {
		return `${base} Confirmed: this instance is unlicensed for custom permission rules (custom_permission_rules_enabled), so it hides them from reads. License the instance to export these rows.`;
	}

	if (entitled === true) {
		return `${base} This instance IS licensed for custom permission rules, so the missing rows are unexpected — investigate before trusting a mirror push.`;
	}

	return `${base} This instance likely hides custom permission rules from reads (unlicensed custom_permission_rules_enabled); the license entitlement could not be confirmed.`;
}

// A deny-list preserves new server fields by default while removing secrets, external FKs, and alias views.
function stripSystemFields(
	records: Record<string, unknown>[],
	resource: Resource,
	extra: readonly string[],
): Record<string, unknown>[] {
	const drop = [...resource.strip, ...resource.aliases, ...extra];

	if (drop.length === 0) return records;

	for (const record of records) {
		for (const field of drop) delete record[field];
	}

	return records;
}

// The static strip lists know only the columns the catalog was written against; fields users add to
// system collections are invisible to them, and a concealed value committed to git survives its history
// forever. The GET /fields catalog names every field the schema marks secret-bearing — the snapshot
// cannot be the authority here: a scoped pull's snapshot omits system-collection field metadata entirely
// while the config resources still export, so a snapshot-derived map would let a custom conceal field on
// e.g. directus_settings sail into the committed artifact unstripped.
function sensitiveFieldsByCollection(catalog: FieldCatalogEntry[]): Map<string, string[]> {
	const map = new Map<string, string[]>();

	for (const entry of catalog) {
		const special = entry.meta?.['special'];
		if (!Array.isArray(special)) continue;

		const secret = special.some(
			(value) => value === 'conceal' || value === 'hash' || (typeof value === 'string' && value.startsWith('encrypt')),
		);

		if (secret) {
			const fields = map.get(entry.collection) ?? [];
			fields.push(entry.field);
			map.set(entry.collection, fields);
		}
	}

	return map;
}

export async function pull(options: PullOptions, ctx: CliContext): Promise<void> {
	const { url, credential, schemaDir, dataDir, project, projectConfig } = resolveTarget(
		options.from,
		ctx,
		options.project,
	);

	const scope = resolveScope(options, projectConfig);

	// The explicit opt-out for resource-only projects: without it, such a project silently committed a
	// FULL snapshot — handing a mirror push delete authority over every collection it never meant to own.
	const includeSchema = options.schema !== false && projectConfig?.schema !== false;

	// A collections scope names schema to pull; combined with a schema skip it is a contradiction, and
	// guessing which wins either resurrects the full-snapshot footgun or silently drops the scope. The
	// config-level pair is already refused at parse; this catches the flag combinations.
	if (!includeSchema && scope !== undefined) {
		throw new CliError('USAGE', 'This pull skips the schema, but a collections scope was given.', {
			hint: 'Remove --collections/--exclude-collections (or the project scope), or drop --no-schema / "schema": false.',
		});
	}

	// Fail invalid resource options before the first network request.
	const resources = resolveResourceSet(options, projectConfig);

	// Provenance preflight BEFORE any network or write: the schema files land first, so a writer-level
	// refusal alone would leave the new source's schema committed beside the old source's data.
	assertDataSource(dataDir, normalizeInstanceUrl(url));

	// Refresh an expiring saved session before the first request so an expired token re-auths silently.
	await refreshSessionIfNeeded(credential);

	const snapshot = includeSchema ? await fetchSnapshot(credential, scope?.api) : null;

	// An explicitly requested collection missing from the fetched snapshot was dropped by the source: a typo
	// or a name that does not exist, or — on Directus without the partial-snapshot folder fix (#27991) — a
	// named collection folder. Left unsaid, the pull commits a partial snapshot missing exactly what was
	// asked for, and a later push fails on the dangling reference. Name the gap so it is visible at pull time.
	if (snapshot !== null && scope !== undefined && 'include' in scope.payload) {
		const present = new Set(snapshot.collections.map((entry) => entry.collection));
		const missing = scope.payload.include.filter((name) => !present.has(name));

		if (missing.length > 0) {
			ctx.ui.warn(
				`Requested ${count(missing.length, 'collection')} not in the pulled schema: ${missing.join(', ')}. ` +
					`Check the spelling and that each collection exists on the source. ` +
					`Older Directus also omits a named collection folder from the snapshot — pull the whole schema instead.`,
			);
		}
	}

	// One keystone read for the whole pull: when the source reports no row cap, every fetch below is a single
	// unbounded read instead of a read plus an exhaustion probe. Best-effort — undefined keeps the probe.
	const queryMax = await fetchQueryLimitMax(credential);

	// Secret protection must not degrade silently: when config resources export, the field catalog read is
	// mandatory and its failure fails the pull. Skipped only when nothing will be exported.
	const sensitiveByCollection =
		resources.length > 0 ? sensitiveFieldsByCollection(await fetchFields(credential)) : new Map<string, string[]>();

	const includesUsers = resources.some((resource) => resource.name === 'users');

	// Whether users are part of the COMMITTED outcome of this pull: in this fetch set, or already committed
	// on disk where the data writer preserves what a pull does not refetch. The access filter below must
	// premise on this, not the fetch set alone — push derives its user echo-protection from the committed
	// tree, so a re-pull that dropped user grants beside a preserved users file would hand a later mirror
	// push those grants as target-side deletions.
	const usersCommitted = includesUsers || hasCommittedCollection(dataDir, 'directus_users');

	const dataCollections: DataCollection[] = [];
	const incomplete: string[] = [];

	// Read the admin-only license entitlement only if a shortfall actually occurs — a clean pull pays
	// nothing, and the result is memoized so repeated shortfalls share one read. Any failure (non-admin,
	// older server) leaves it undefined and the message degrades to inference.
	let entitlementResolved = false;
	let customRulesEntitled: boolean | undefined;

	const customRulesEntitlement = async (): Promise<boolean | undefined> => {
		if (!entitlementResolved) {
			entitlementResolved = true;
			customRulesEntitled = await fetchCustomPermissionRulesEntitled(credential);
		}

		return customRulesEntitled;
	};

	for (const resource of resources) {
		let rows = await fetchRecords(
			credential,
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

		// Unlicensed instances hide custom-rule permissions from every read path, so the fetch above can be
		// silently short. total_count is computed on the database and still sees them — a shortfall is
		// recorded in the committed manifest (merge/add stay safe; mirror refuses an incomplete export).
		// An UNANSWERED probe marks incomplete too: unknown cannot vouch for a mirror's deletions.
		if (resource.verifyCount === true) {
			const total = await fetchTotalCount(credential, resource.endpoint);

			if (total === undefined) {
				incomplete.push(resource.collection);

				ctx.ui.warn(
					`${resource.name}: could not verify the export is complete (total_count unavailable) — marked incomplete. Merge and add pushes stay safe, mirror pushes will refuse it; re-pull to retry the check.`,
				);
			} else if (total !== rows.length) {
				incomplete.push(resource.collection);

				ctx.ui.warn(permissionsShortfallWarning(resource.name, rows.length, total, await customRulesEntitlement()));
			}
		}

		// Custom secret-bearing fields drop alongside the static list, but named — a field the operator
		// added disappearing from the export without a word would read as data loss, not protection.
		const derivedSecrets = (sensitiveByCollection.get(resource.collection) ?? []).filter(
			(field) => !resource.strip.includes(field) && !resource.aliases.includes(field),
		);

		if (derivedSecrets.length > 0) {
			ctx.ui.warn(
				`${resource.name}: stripped ${count(derivedSecrets.length, 'custom field')} the schema marks sensitive (conceal/encrypt/hash): ${derivedSecrets.join(', ')}. The export never carries these values — set them on the target directly.`,
			);
		}

		rows = stripSystemFields(rows, resource, derivedSecrets);

		if (resource.collection === 'directus_access') {
			if (!usersCommitted) {
				// User-attached access rows reference users that are out of scope; importing them fails the
				// missing-FK check (INVALID_FOREIGN_KEY) and deleting them target-side under mirror is the
				// directus-sync #148 data-loss class. Ship only the null-user (role/policy-level) grants.
				rows = rows.filter((record) => record['user'] === null || record['user'] === undefined);
			} else if (!includesUsers && rows.some((record) => record['user'] !== null && record['user'] !== undefined)) {
				// The kept grants lean on a users export this pull did not refresh — surface the staleness now,
				// not as a push-time FK failure when a newer source user's grant arrives.
				ctx.ui.warn(
					`${resource.name}: kept user-attached grants because directus_users is committed from an earlier --users pull, but this pull did not refresh the user accounts themselves — a grant for a user added on the source since then fails the import. Re-pull with --users to refresh accounts, or delete the users data file to drop accounts from the sync.`,
				);
			}
		}

		// Request-operation headers round-trip verbatim — stripping them would break every legitimate
		// header on push — yet they are exactly where Authorization values and API keys get pasted. The
		// warn fires only when a header actually exists, so it stays a signal instead of noise the
		// operator learns to skim past.
		if (resource.collection === 'directus_operations') {
			const carriers = rows.filter((record) => {
				if (record['type'] !== 'request') return false;
				const options = record['options'];

				return (
					options !== null &&
					typeof options === 'object' &&
					'headers' in options &&
					Array.isArray(options.headers) &&
					options.headers.length > 0
				);
			});

			if (carriers.length > 0) {
				const keys = carriers.map((record) => String(record['key'] ?? record['id']));

				ctx.ui.warn(
					`${resource.name}: request operations with custom headers export verbatim: ${keys.join(', ')}. Headers routinely embed Authorization values and API keys — review them for credentials before committing.`,
				);
			}
		}

		dataCollections.push({ collection: resource.collection, primaryKey: resource.primaryKey, records: rows });
	}

	const result = snapshot === null ? null : writeSnapshotFiles(schemaDir, snapshot, scope?.write);

	// Warn about references pointing outside the committed set — a scoped pull can strand a group parent or
	// relation target the snapshot omits, which fails apply on a fresh target (Chris/Judd thread). Detect over
	// the committed snapshot, not this fetch: a scoped pull preserves out-of-scope files from a prior full
	// pull, so the on-disk set is what a later push actually carries. A schema-skipping pull commits no
	// schema, and a schema: false project's push ignores any stale files — nothing to warn over.
	if (snapshot !== null) {
		const references = findOutOfScopeReferences(readSnapshotFiles(schemaDir));
		if (references.length > 0) ctx.ui.warn(formatOutOfScopeReferences(references));
	}

	const relativeDir = relative(ctx.cwd, schemaDir);
	const collections = snapshot?.collections.length ?? 0;
	const removed = result?.removed.length ?? 0;

	// The source URL selects the correct source→target ID-map bucket during push.
	const dataResult = writeDataFiles(dataDir, dataCollections, normalizeInstanceUrl(url), incomplete);
	const records = dataCollections.reduce((total, entry) => total + entry.records.length, 0);
	const dataDirRelative = relative(ctx.cwd, dataDir);
	const collectionCount = dataCollections.length;

	const data: PullDataReport = {
		resources: dataCollections.map((entry) => entry.collection),
		collections: collectionCount,
		records,
		files: dataResult.written.length,
		removed: dataResult.removed,
		// The COMMITTED state, not just this pull's findings: preserved files carry their markers forward.
		incomplete: dataResult.incomplete,
	};

	// One line per axis so "collection" never means two things in one sentence: Schema is structure for
	// every collection, Resources are the directus_* config records.
	if (!ctx.ui.json) {
		const schemaNote = `${scope?.note ?? ''}${removed > 0 ? ` (removed ${count(removed, 'stale file')})` : ''}`;

		const dataNote =
			dataResult.removed.length > 0 ? ` (removed ${count(dataResult.removed.length, 'stale file')})` : '';

		ctx.ui.success(`Pulled from ${options.from} — ${url}`);

		if (snapshot === null) {
			ctx.ui.print('  Schema     skipped');
		} else {
			ctx.ui.print(`  Schema     ${count(collections, 'collection')} → ${relativeDir}${schemaNote}`);
		}

		ctx.ui.print(
			`  Resources  ${count(records, 'record')} in ${count(collectionCount, 'resource')} → ${dataDirRelative}${dataNote}`,
		);
	}

	// schemaSkipped is the explicit marker; the schema block nulls out with it so a consumer can never
	// mistake a skipped phase for an empty snapshot.
	ctx.ui.data({
		kind: 'PullReport',
		formatVersion: 1,
		ok: true,
		source: url,
		profile: options.from,
		project,
		schemaSkipped: snapshot === null,
		dir: snapshot === null ? null : relativeDir,
		collections: snapshot === null ? null : collections,
		fields: snapshot === null ? null : snapshot.fields.length,
		systemFields: snapshot === null ? null : snapshot.systemFields.length,
		relations: snapshot === null ? null : snapshot.relations.length,
		files: result === null ? null : result.written.length,
		removed: result === null ? null : result.removed,
		scope: scope?.payload ?? null,
		data,
	});
}
