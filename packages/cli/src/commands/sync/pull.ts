import { relative } from 'node:path';
import { appAccessMinimalPermissions } from '@directus/system-data';
import type { Command } from 'commander';
import { isEqual, isPlainObject } from 'lodash-es';
import type { ProjectConfig } from '../../kernel/config/file.js';
import {
	fetchCustomPermissionRulesEntitled,
	fetchQueryLimitMax,
	fetchTotalCount,
	refreshSessionIfNeeded,
} from '../../kernel/connection.js';
import { CliError } from '../../kernel/error.js';
import type { CliContext } from '../../kernel/run.js';
import { maybePluralize, parseList } from '../../kernel/text.js';
import { fetchFields, fetchRecords, fetchSnapshot, type FieldCatalogEntry, type SnapshotScope } from './utils/api.js';
import { assertDataSource, type DataCollection, hasCommittedCollection, writeDataFiles } from './utils/data-store.js';
import { normalizeInstanceUrl } from './utils/id-map.js';
import { assertSyncPreflight } from './utils/preflight.js';
import {
	findOutOfScopeReferences,
	findSplitRelations,
	formatOutOfScopeReferences,
	formatSplitRelations,
} from './utils/references.js';
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
	if (options.collections !== undefined && options.excludeCollections !== undefined) {
		throw new CliError('USAGE', 'Pass --collections or --exclude-collections, not both.');
	}

	if (options.collections?.length === 0) {
		throw new CliError('USAGE', '--collections needs at least one collection name.');
	}

	if (options.excludeCollections?.length === 0) {
		throw new CliError('USAGE', '--exclude-collections needs at least one collection name.');
	}

	let pair: { readonly include: string[] } | { readonly exclude: string[] } | undefined;

	if (options.collections !== undefined) {
		pair = { include: [...options.collections] };
	} else if (options.excludeCollections !== undefined) {
		pair = { exclude: [...options.excludeCollections] };
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

/** Dependency expansion would silently pull an excluded resource back in. */
function resolveWithoutExcluded(kept: string[], excluded: readonly string[], deps: boolean): Resource[] {
	const resources = resolveResources(kept, { deps });

	for (const entry of resources) {
		if (!excluded.includes(entry.name)) continue;

		const dependent = kept.find((name) =>
			resolveResources([name], { deps }).some((required) => required.name === entry.name),
		);

		throw new CliError('USAGE', `Cannot exclude "${entry.name}": "${dependent}" requires it and would pull it back.`, {
			hint: `Exclude "${dependent}" as well, or keep "${entry.name}".`,
		});
	}

	return resources;
}

function resolveResourceSet(options: PullOptions, projectConfig: ProjectConfig | undefined): Resource[] {
	// Only --no-deps exists, so undefined leaves configuration precedence intact.
	const deps = options.deps === false ? false : (projectConfig?.deps ?? true);

	const positives = SELECTABLE_RESOURCES.filter((name) => options[name] === true);
	const negatives = SELECTABLE_RESOURCES.filter((name) => options[name] === false);

	if (options.all === true && positives.length > 0) {
		throw new CliError(
			'USAGE',
			'--all already includes every resource; drop the named resources or subtract with --no-<resource>.',
		);
	}

	if (positives.length > 0 && negatives.length > 0) {
		throw new CliError('USAGE', 'Name the resources you want, or subtract them with --no-<resource> — not both.');
	}

	// Any resource flag overrides configured resources wholesale.
	if (options.all === true) {
		return resolveWithoutExcluded(
			SELECTABLE_RESOURCES.filter((name) => !negatives.includes(name)),
			negatives,
			deps,
		);
	}

	if (positives.length > 0) return resolveResources(positives, { deps });

	if (negatives.length > 0) {
		return resolveWithoutExcluded(
			DEFAULT_RESOURCE_NAMES.filter((name) => !negatives.includes(name)),
			negatives,
			deps,
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

		return resolveWithoutExcluded(
			DEFAULT_RESOURCE_NAMES.filter((name) => !configExclude.includes(name)),
			configExclude,
			deps,
		);
	}

	return resolveResources(DEFAULT_RESOURCE_NAMES, { deps });
}

function permissionsShortfallWarning(
	name: string,
	pulled: number,
	total: number,
	entitled: boolean | undefined,
): string {
	const missing = Math.max(total - pulled, 0);
	const base = `${name}: Directus returned ${pulled} of ${total} stored permission records — the API withheld ${maybePluralize(missing, 'stored row')} the CLI cannot inspect.`;

	// The hidden rows never reach the CLI, so "may only be minimums" is the strongest honest claim.
	const maybeMinimums =
		'Some hidden rows may only be the app-access minimums Directus recreates automatically, but the CLI cannot verify that.';

	const safety =
		'Merge and add continue with the visible records. Mirror is blocked so hidden permissions are not deleted on the target.';

	if (entitled === false) {
		return `${base} This instance is not licensed for custom permission rules, so Directus hides stored permissions that use filters, field restrictions, validation, or presets. ${maybeMinimums} ${safety} License the source instance and re-pull to include authored rules.`;
	}

	if (entitled === true) {
		return `${base} This instance is licensed for custom permission rules, so the omission is unexpected. ${safety} Investigate the source before pushing.`;
	}

	return `${base} This usually means the source is not licensed for custom permission rules, which hides stored permissions that use filters, field restrictions, validation, or presets; the license status could not be confirmed. ${maybeMinimums} ${safety}`;
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

/**
 * Stored duplicates of the static app-access minimums are noise: the server recreates them for any
 * app-access policy. Only an exact match against the compiled-in list is dropped — a drifted row is
 * kept. If a future Directus removes an entry from its minimums this list must follow, or a mirror
 * push would delete a stored row nothing recreates.
 */
function withoutRedundantAppAccessMinimums(collections: DataCollection[]): {
	collections: DataCollection[];
	dropped: number;
} {
	const policies = collections.find((entry) => entry.collection === 'directus_policies');
	if (policies === undefined) return { collections, dropped: 0 };

	const appAccessPolicyIds = new Set(
		policies.records
			.filter((record) => record['app_access'] === true)
			.map((record) => record[policies.primaryKey])
			.filter((id): id is string | number => typeof id === 'string' || typeof id === 'number')
			.map(String),
	);

	if (appAccessPolicyIds.size === 0) return { collections, dropped: 0 };

	let dropped = 0;

	const normalized = collections.map((entry) => {
		if (entry.collection !== 'directus_permissions') return entry;

		const records = entry.records.filter((record) => {
			const policy = record['policy'];

			if ((typeof policy !== 'string' && typeof policy !== 'number') || !appAccessPolicyIds.has(String(policy))) {
				return true;
			}

			const redundant = appAccessMinimalPermissions.some(
				(minimum) =>
					record['collection'] === minimum.collection &&
					record['action'] === minimum.action &&
					isEqual(record['fields'], minimum.fields) &&
					isEqual(record['permissions'], minimum.permissions) &&
					isEqual(record['validation'], minimum.validation) &&
					isEqual(record['presets'], minimum.presets),
			);

			if (redundant) dropped += 1;

			return !redundant;
		});

		return { ...entry, records };
	});

	return { collections: normalized, dropped };
}

// Catches secret-bearing custom fields no static strip list could know about.
function sensitiveFieldsByCollection(catalog: FieldCatalogEntry[]): Map<string, string[]> {
	const map = new Map<string, string[]>();

	for (const entry of catalog) {
		const special = entry.meta?.['special'];
		if (special === undefined || special === null) continue;

		// A malformed special could hide "conceal"; skipping it would silently commit a secret.
		if (!Array.isArray(special)) {
			throw new CliError(
				'HTTP',
				`The /fields entry for ${entry.collection}.${entry.field} has a malformed "special" value, so sensitive fields cannot be determined.`,
			);
		}

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

	if (!includeSchema && scope !== undefined) {
		throw new CliError('USAGE', 'This pull skips the schema, but a collections scope was given.', {
			hint: 'Remove --collections/--exclude-collections (or the project scope), or drop --no-schema / "schema": false.',
		});
	}

	const resources = resolveResourceSet(options, projectConfig);

	// Refuse source changes before schema writes can mix provenance with preserved data.
	assertDataSource(dataDir, normalizeInstanceUrl(url));

	await refreshSessionIfNeeded(credential);
	await assertSyncPreflight(credential, options.from, (message) => ctx.ui.warn(message));

	const snapshot = includeSchema ? await fetchSnapshot(credential, scope?.api) : null;

	if (snapshot !== null && scope !== undefined && 'include' in scope.api) {
		const present = new Set(snapshot.collections.map((entry) => entry.collection));
		const missing = scope.api.include.filter((name) => !present.has(name));

		if (missing.length > 0) {
			ctx.ui.warn(
				`Requested ${maybePluralize(missing.length, 'collection')} not in the pulled schema: ${missing.join(', ')}. ` +
					`Check the spelling and that each collection exists on the source. ` +
					`Older Directus also omits a named collection folder from the snapshot — pull the whole schema instead.`,
			);
		}
	}

	const queryMax = await fetchQueryLimitMax(credential);

	// Secret stripping must fail closed when configuration resources are pulled.
	const sensitiveByCollection =
		resources.length > 0 ? sensitiveFieldsByCollection(await fetchFields(credential)) : new Map<string, string[]>();

	const includesUsers = resources.some((resource) => resource.name === 'users');

	// Users preserved by an earlier pull still count; judging by this fetch alone could delete their grants.
	const usersCommitted = includesUsers || hasCommittedCollection(dataDir, 'directus_users');

	const dataCollections: DataCollection[] = [];
	const incomplete: string[] = [];

	for (const resource of resources) {
		let rows = await fetchRecords(credential, resource, queryMax);

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

		const derivedSecrets = (sensitiveByCollection.get(resource.collection) ?? []).filter(
			(field) => !resource.strip.includes(field) && !resource.aliases.includes(field),
		);

		if (derivedSecrets.length > 0) {
			ctx.ui.warn(
				`${resource.name}: stripped ${maybePluralize(derivedSecrets.length, 'custom field')} the schema marks sensitive (conceal/encrypt/hash): ${derivedSecrets.join(', ')}. The local files never carry these values — set them on the target directly.`,
			);
		}

		rows = stripSystemFields(rows, resource, derivedSecrets);

		if (resource.collection === 'directus_access') {
			if (!usersCommitted) {
				// User-attached grants cannot be pushed safely when their users are out of scope.
				rows = rows.filter((record) => record['user'] === null || record['user'] === undefined);
			} else if (!includesUsers && rows.some((record) => record['user'] !== null && record['user'] !== undefined)) {
				ctx.ui.warn(
					`${resource.name}: kept user-attached grants because directus_users is present in local files from an earlier --users pull, but this pull did not refresh the user accounts themselves — a grant for a user added on the source since then fails the push. Re-pull with --users to refresh accounts, or delete the users configuration file to drop accounts from the sync.`,
				);
			}
		}

		// The options must round-trip, so warn instead of stripping possible credentials.
		if (resource.collection === 'directus_operations') {
			const carriers: string[] = [];

			for (const record of rows) {
				if (record['type'] !== 'request') continue;

				const options = record['options'];
				if (!isPlainObject(options)) continue;

				const opts = options as Record<string, unknown>;
				const parts: string[] = [];

				const headers = opts['headers'];
				if (Array.isArray(headers) && headers.length > 0) parts.push('headers');

				const url = opts['url'];
				if (typeof url === 'string' && (url.includes('?') || url.includes('@'))) parts.push('URL');

				const body = opts['body'];
				if ((typeof body === 'string' && body !== '') || isPlainObject(body)) parts.push('body');

				if (parts.length === 0) continue;

				// A key is only unique per flow, so name the operation the way the Data Studio does.
				const name = record['name'];
				const label = typeof name === 'string' && name !== '' ? name : String(record['key'] ?? record['id']);
				carriers.push(`${label} (${parts.join(', ')})`);
			}

			if (carriers.length > 0) {
				ctx.ui.warn(
					`${resource.name}: request operations are pulled verbatim, and headers, URL parameters, and bodies routinely embed Authorization values and API keys: ${carriers.join(', ')}. Review them for credentials before committing.`,
				);
			}
		}

		dataCollections.push({ collection: resource.collection, primaryKey: resource.primaryKey, records: rows });
	}

	const { collections: normalizedDataCollections, dropped } = withoutRedundantAppAccessMinimums(dataCollections);

	if (dropped > 0) {
		ctx.ui.info(
			`permissions: dropped ${maybePluralize(dropped, 'stored row')} identical to the app-access minimums — app-access policies recreate them on the target.`,
		);
	}

	const result = snapshot === null ? null : writeSnapshotFiles(schemaDir, snapshot, scope?.write);

	// Validate references against the stored set because scoped pulls preserve earlier artifacts.
	if (snapshot !== null) {
		const stored = readSnapshotFiles(schemaDir);

		const references = findOutOfScopeReferences(stored);
		if (references.length > 0) ctx.ui.warn(formatOutOfScopeReferences(references));

		const splits = findSplitRelations(stored);
		if (splits.length > 0) ctx.ui.warn(formatSplitRelations(splits, 'pull'));
	}

	const relativeDir = relative(ctx.cwd, schemaDir);
	const schemaCollectionCount = snapshot?.collections.length ?? 0;
	const removed = result?.removed.length ?? 0;

	const dataResult = writeDataFiles(dataDir, normalizedDataCollections, normalizeInstanceUrl(url), incomplete);
	const recordCount = normalizedDataCollections.reduce((total, entry) => total + entry.records.length, 0);
	const dataDirRelative = relative(ctx.cwd, dataDir);
	const collectionCount = normalizedDataCollections.length;

	const data: PullDataReport = {
		resources: resources.map((resource) => resource.name),
		collections: normalizedDataCollections.map((entry) => entry.collection),
		recordCount,
		collectionCount,
		fileCount: dataResult.written.length,
		removed: dataResult.removed,
		incomplete: dataResult.incomplete,
	};

	if (!ctx.ui.json) {
		const schemaNote = `${scope?.note ?? ''}${removed > 0 ? ` (removed ${maybePluralize(removed, 'stale file')})` : ''}`;

		const dataNote =
			dataResult.removed.length > 0 ? ` (removed ${maybePluralize(dataResult.removed.length, 'stale file')})` : '';

		ctx.ui.success(`Pulled from ${options.from} — ${url}`);

		if (snapshot === null) {
			ctx.ui.print('  Schema         skipped');
		} else {
			ctx.ui.print(
				`  Schema         ${maybePluralize(schemaCollectionCount, 'collection')} → ${relativeDir}${schemaNote}`,
			);
		}

		ctx.ui.print(
			`  Configuration  ${maybePluralize(recordCount, 'record')} across ${maybePluralize(collectionCount, 'collection')} → ${dataDirRelative}${dataNote}`,
		);
	}

	// Null schema fields distinguish a skipped phase from an empty snapshot.
	ctx.ui.result({
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
