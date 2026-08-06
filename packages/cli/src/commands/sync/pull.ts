import { relative } from 'node:path';
import type { Command } from 'commander';
import { isPlainObject } from 'lodash-es';
import type { ProjectConfig } from '../../kernel/config/file.js';
import {
	fetchCustomPermissionRulesEntitled,
	fetchQueryLimitMax,
	fetchTotalCount,
	refreshSessionIfNeeded,
} from '../../kernel/connection.js';
import { CliError } from '../../kernel/error.js';
import type { CliContext } from '../../kernel/run.js';
import { count, parseList } from '../../kernel/text.js';
import { fetchFields, fetchRecords, fetchSnapshot, type FieldCatalogEntry, type SnapshotScope } from './utils/api.js';
import { assertDataSource, type DataCollection, hasCommittedCollection, writeDataFiles } from './utils/data-store.js';
import { normalizeInstanceUrl } from './utils/id-map.js';
import { findOutOfScopeReferences, formatOutOfScopeReferences } from './utils/references.js';
import { resolveTarget } from './utils/resolve-target.js';
import {
	resolveResources,
	type Resource,
	RESOURCE_FLAG_PHRASES,
	SELECTABLE_RESOURCES,
	type SelectableResource,
} from './utils/resources.js';
import { readSnapshotFiles, type WriteScope, writeSnapshotFiles } from './utils/store.js';

export type PullOptions = {
	readonly from: string;
	readonly collections?: readonly string[];
	readonly excludeCollections?: readonly string[];
	readonly all?: boolean;
	readonly deps: boolean;
	/** Commander only defines --no-schema, so false means the flag was passed; true is the default. */
	readonly schema?: boolean;
	readonly project: string;
	// Commander camel-cases each --<resource>/--no-<resource> flag onto opts().
} & Partial<Record<SelectableResource, boolean>>;

export function registerPull(command: Command, getContext: () => CliContext): void {
	const pullCommand = command
		.command('pull')
		.description('Pull schema and configuration from a source instance into the configured project directory')
		.requiredOption('--from <profile>', 'Source profile name')
		.option('--collections <list>', 'Only these collections (comma-separated); pulls a partial snapshot', parseList)
		.option(
			'--exclude-collections <list>',
			'All collections except these (comma-separated); pulls a partial snapshot',
			parseList,
		)
		.option('--all', 'Every configuration resource, including users');

	// Positive flags must precede their --no-* twins to preserve undefined as the default.
	for (const name of SELECTABLE_RESOURCES) {
		pullCommand
			.option(`--${name}`, `Only the named configuration resources — ${RESOURCE_FLAG_PHRASES[name]}`)
			.option(`--no-${name}`, `Exclude ${name} from the default set`);
	}

	pullCommand
		.option(
			'--no-deps',
			'Do not pull configuration-resource dependencies (dependent children still ride with their parent)',
		)
		.option(
			'--no-schema',
			'Skip the schema snapshot — configuration resources only ("schema": false in a project configuration does the same)',
		)
		.option('--project <name>', 'Project scope to sync (default: default)', 'default')
		.action((options: PullOptions) => pull(options, getContext()));
}

interface PullDataReport {
	readonly resources: string[];
	readonly collections: string[];
	readonly recordCount: number;
	readonly collectionCount: number;
	readonly fileCount: number;
	readonly removed: string[];
	readonly incomplete: string[];
}

interface ResolvedScope {
	readonly api: SnapshotScope;
	readonly write: WriteScope;
	readonly note: string;
}

function resolveScope(options: PullOptions, projectConfig: ProjectConfig | undefined): ResolvedScope | undefined {
	let pair: { readonly include: string[] } | { readonly exclude: string[] } | undefined;

	// CLI scope overrides configured scope wholesale.
	if (options.collections !== undefined || options.excludeCollections !== undefined) {
		if (options.collections !== undefined && options.excludeCollections !== undefined) {
			throw new CliError('USAGE', 'Pass --collections or --exclude-collections, not both.');
		}

		if (options.collections !== undefined) {
			if (options.collections.length === 0) {
				throw new CliError('USAGE', '--collections needs at least one collection name.');
			}

			pair = { include: [...options.collections] };
		} else if (options.excludeCollections !== undefined) {
			if (options.excludeCollections.length === 0) {
				throw new CliError('USAGE', '--exclude-collections needs at least one collection name.');
			}

			pair = { exclude: [...options.excludeCollections] };
		}
	} else {
		const include = projectConfig?.collections;
		const exclude = projectConfig?.excludeCollections;

		if (include !== undefined && exclude !== undefined) {
			throw new CliError('CONFIG', `Project "${options.project}" sets both collections and excludeCollections.`);
		}

		if (include !== undefined) pair = { include: [...include] };
		if (exclude !== undefined) pair = { exclude: [...exclude] };
	}

	if (pair === undefined) return undefined;

	if ('include' in pair) {
		const include = pair.include;

		return {
			api: { include },
			write: { inScope: (name) => include.includes(name) },
			note: ` (scoped to: ${include.join(', ')})`,
		};
	}

	const exclude = pair.exclude;

	return {
		api: { exclude },
		write: { inScope: (name) => !exclude.includes(name) },
		note: ` (excluding: ${exclude.join(', ')})`,
	};
}

// Users require explicit selection; every other configuration resource is included by default.
const DEFAULT_RESOURCE_NAMES = SELECTABLE_RESOURCES.filter((name) => name !== 'users');

function resolveResourceSet(options: PullOptions, projectConfig: ProjectConfig | undefined): Resource[] {
	// Commander defines only the negative flag, preserving configuration/default precedence when it is absent.
	const deps = options.deps === false ? false : (projectConfig?.deps ?? true);

	const positives = SELECTABLE_RESOURCES.filter((name) => options[name] === true);
	const negatives = SELECTABLE_RESOURCES.filter((name) => options[name] === false);

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
			if (!SELECTABLE_RESOURCES.some((selectable) => selectable === name)) {
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

// Attribute a permissions shortfall to licensing only when the entitlement confirms it.
function permissionsShortfallWarning(
	name: string,
	pulled: number,
	total: number,
	entitled: boolean | undefined,
): string {
	const base = `${name}: pulled ${pulled} of ${total} records — the pull is incomplete: merge and add pushes stay safe, mirror pushes will refuse it.`;

	if (entitled === false) {
		return `${base} Confirmed: this instance is unlicensed for custom permission rules (custom_permission_rules_enabled), so it hides them from reads. License the instance to pull these records.`;
	}

	if (entitled === true) {
		return `${base} This instance IS licensed for custom permission rules, so the missing records are unexpected — investigate before trusting a mirror push.`;
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

	return records.map((record) => {
		const stripped = { ...record };
		for (const field of drop) delete stripped[field];
		return stripped;
	});
}

// The field catalog catches custom secret-bearing fields that static strip lists cannot know about.
// It remains authoritative for scoped pulls whose snapshots omit system-collection field metadata.
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
		options.project,
		ctx,
	);

	const scope = resolveScope(options, projectConfig);

	const includeSchema = options.schema !== false && projectConfig?.schema !== false;

	// A schema scope and schema skip are contradictory; neither can safely win by precedence.
	if (!includeSchema && scope !== undefined) {
		throw new CliError('USAGE', 'This pull skips the schema, but a collections scope was given.', {
			hint: 'Remove --collections/--exclude-collections (or the project scope), or drop --no-schema / "schema": false.',
		});
	}

	const resources = resolveResourceSet(options, projectConfig);

	// Refuse source changes before schema writes can mix provenance with preserved data.
	assertDataSource(dataDir, normalizeInstanceUrl(url));

	await refreshSessionIfNeeded(credential);

	const snapshot = includeSchema ? await fetchSnapshot(credential, scope?.api) : null;

	// A scoped snapshot that omits requested names is unsafe to write as a complete answer to that scope.
	if (snapshot !== null && scope !== undefined && 'include' in scope.api) {
		const present = new Set(snapshot.collections.map((entry) => entry.collection));
		const missing = scope.api.include.filter((name) => !present.has(name));

		if (missing.length > 0) {
			ctx.ui.warn(
				`Requested ${count(missing.length, 'collection')} not in the pulled schema: ${missing.join(', ')}. ` +
					`Check the spelling and that each collection exists on the source. ` +
					`Older Directus also omits a named collection folder from the snapshot — pull the whole schema instead.`,
			);
		}
	}

	// One best-effort limit read can remove an exhaustion probe from every collection fetch.
	const queryMax = await fetchQueryLimitMax(credential);

	// Secret stripping must fail closed when configuration resources are pulled.
	const sensitiveByCollection =
		resources.length > 0 ? sensitiveFieldsByCollection(await fetchFields(credential)) : new Map<string, string[]>();

	const includesUsers = resources.some((resource) => resource.name === 'users');

	// Access filtering follows the stored outcome, including preserved users from earlier pulls.
	// Using only this fetch set could turn preserved grants into mirror deletions.
	const usersCommitted = includesUsers || hasCommittedCollection(dataDir, 'directus_users');

	const dataCollections: DataCollection[] = [];
	const incomplete: string[] = [];

	for (const resource of resources) {
		let rows = await fetchRecords(credential, resource, queryMax);

		// Unknown or truncated reads cannot authorize mirror deletions.
		if (resource.verifyCount === true) {
			const total = await fetchTotalCount(credential, resource.endpoint);

			if (total === undefined) {
				incomplete.push(resource.collection);

				ctx.ui.warn(
					`${resource.name}: could not verify the pull is complete (total_count unavailable) — marked incomplete. Merge and add pushes stay safe, mirror pushes will refuse it; re-pull to retry the check.`,
				);
			} else if (total !== rows.length) {
				incomplete.push(resource.collection);

				ctx.ui.warn(
					permissionsShortfallWarning(
						resource.name,
						rows.length,
						total,
						await fetchCustomPermissionRulesEntitled(credential),
					),
				);
			}
		}

		// Name custom stripped fields so their absence is not mistaken for data loss.
		const derivedSecrets = (sensitiveByCollection.get(resource.collection) ?? []).filter(
			(field) => !resource.strip.includes(field) && !resource.aliases.includes(field),
		);

		if (derivedSecrets.length > 0) {
			ctx.ui.warn(
				`${resource.name}: stripped ${count(derivedSecrets.length, 'custom field')} the schema marks sensitive (conceal/encrypt/hash): ${derivedSecrets.join(', ')}. The local files never carry these values — set them on the target directly.`,
			);
		}

		rows = stripSystemFields(rows, resource, derivedSecrets);

		if (resource.collection === 'directus_access') {
			if (!usersCommitted) {
				// User-attached grants cannot be pushed safely when their users are out of scope.
				rows = rows.filter((record) => record['user'] === null || record['user'] === undefined);
			} else if (!includesUsers && rows.some((record) => record['user'] !== null && record['user'] !== undefined)) {
				// Preserved users may be stale relative to newly fetched grants.
				ctx.ui.warn(
					`${resource.name}: kept user-attached grants because directus_users is present in local files from an earlier --users pull, but this pull did not refresh the user accounts themselves — a grant for a user added on the source since then fails the push. Re-pull with --users to refresh accounts, or delete the users configuration file to drop accounts from the sync.`,
				);
			}
		}

		// Headers must round-trip, so warn instead of stripping possible credentials.
		if (resource.collection === 'directus_operations') {
			const carriers = rows.filter((record) => {
				if (record['type'] !== 'request') return false;

				const options = record['options'];
				if (!isPlainObject(options)) return false;

				const headers = (options as Record<string, unknown>)['headers'];
				return Array.isArray(headers) && headers.length > 0;
			});

			if (carriers.length > 0) {
				// A key is only unique per flow, so name the operation the way the Data Studio does.
				const names = carriers.map((record) => {
					const name = record['name'];
					return typeof name === 'string' && name !== '' ? name : String(record['key'] ?? record['id']);
				});

				ctx.ui.warn(
					`${resource.name}: request operations with custom headers are pulled verbatim: ${names.join(', ')}. Headers routinely embed Authorization values and API keys — review them for credentials before committing.`,
				);
			}
		}

		dataCollections.push({ collection: resource.collection, primaryKey: resource.primaryKey, records: rows });
	}

	const result = snapshot === null ? null : writeSnapshotFiles(schemaDir, snapshot, scope?.write);

	// Validate references against the stored set because scoped pulls preserve earlier artifacts.
	if (snapshot !== null) {
		const references = findOutOfScopeReferences(readSnapshotFiles(schemaDir));
		if (references.length > 0) ctx.ui.warn(formatOutOfScopeReferences(references));
	}

	const relativeDir = relative(ctx.cwd, schemaDir);
	const schemaCollectionCount = snapshot?.collections.length ?? 0;
	const removed = result?.removed.length ?? 0;

	const dataResult = writeDataFiles(dataDir, dataCollections, normalizeInstanceUrl(url), incomplete);
	const recordCount = dataCollections.reduce((total, entry) => total + entry.records.length, 0);
	const dataDirRelative = relative(ctx.cwd, dataDir);
	const collectionCount = dataCollections.length;

	const data: PullDataReport = {
		resources: resources.map((resource) => resource.name),
		collections: dataCollections.map((entry) => entry.collection),
		recordCount,
		collectionCount,
		fileCount: dataResult.written.length,
		removed: dataResult.removed,
		incomplete: dataResult.incomplete,
	};

	if (!ctx.ui.json) {
		const schemaNote = `${scope?.note ?? ''}${removed > 0 ? ` (removed ${count(removed, 'stale file')})` : ''}`;

		const dataNote =
			dataResult.removed.length > 0 ? ` (removed ${count(dataResult.removed.length, 'stale file')})` : '';

		ctx.ui.success(`Pulled from ${options.from} — ${url}`);

		if (snapshot === null) {
			ctx.ui.print('  Schema         skipped');
		} else {
			ctx.ui.print(`  Schema         ${count(schemaCollectionCount, 'collection')} → ${relativeDir}${schemaNote}`);
		}

		ctx.ui.print(
			`  Configuration  ${count(recordCount, 'record')} across ${count(collectionCount, 'collection')} → ${dataDirRelative}${dataNote}`,
		);
	}

	// Null schema fields distinguish a skipped phase from an empty snapshot.
	ctx.ui.data({
		kind: 'PullReport',
		formatVersion: 1,
		ok: true,
		source: url,
		profile: options.from,
		project,
		schemaSkipped: snapshot === null,
		dir: snapshot === null ? null : relativeDir,
		collections: snapshot === null ? null : schemaCollectionCount,
		fields: snapshot === null ? null : snapshot.fields.length,
		systemFields: snapshot === null ? null : snapshot.systemFields.length,
		relations: snapshot === null ? null : snapshot.relations.length,
		files: result === null ? null : result.written.length,
		removed: result === null ? null : result.removed,
		scope: scope?.api ?? null,
		data,
	});
}
