import { CliError } from '../kernel/error.js';
import { byCodepoint } from './codepoint.js';

/** A system field that references another synced collection. */
export interface FkField {
	readonly field: string;
	readonly references: string;
}

/** The export rules a syncable Directus system resource declares, apart from how its records are identified. */
interface ResourceFields {
	readonly name: string;
	readonly collection: string;
	readonly endpoint: string;
	readonly primaryKey: string;
	readonly singleton: boolean;
	readonly strip: readonly string[];
	readonly aliases: readonly string[];
	/**
	 * Export-surviving system FKs used by reconciliation and import remapping. Derived from
	 * `packages/system-data/src/relations/relations.yaml`.
	 */
	readonly fkFields: readonly FkField[];
	/** Rows the server derives at read time (never real records); dropped at fetch, before export. */
	readonly drop?: ((record: Record<string, unknown>) => boolean) | undefined;
	/**
	 * Page by PK cursor (filter _gt) instead of offset. Only integer-PK endpoints may opt in — the query
	 * validator forbids _gt on uuid fields (get-filter-operators-for-type.ts).
	 */
	readonly keyset?: boolean | undefined;
	/**
	 * Verify the fetched row count against the server's total_count at pull time. Opt-in for endpoints
	 * whose reads can be silently filtered, so an incomplete export is detected instead of committed.
	 */
	readonly verifyCount?: boolean | undefined;
}

/**
 * A syncable Directus system resource. `naturalKey` names the fields that identify the same record across
 * instances with different primary keys; an omitted key means the resource has no stable cross-instance
 * identity, so its records are never reconciled by key.
 *
 * The two variants encode the import rule the push depends on: an unmatched auto-increment key is never
 * sent, because the target may have given that same integer to an unrelated row and the import would
 * overwrite it. The server assigns a fresh key instead, and only a natural key can rediscover it — so an
 * integer-PK resource must declare one. A uuid is globally unique, safe to send verbatim, and may go
 * unkeyed.
 */
export type Resource =
	| (ResourceFields & { readonly primaryKeyType: 'uuid'; readonly naturalKey?: readonly string[] })
	| (ResourceFields & { readonly primaryKeyType: 'integer'; readonly naturalKey: readonly string[] });

type ResourceDef = Resource & {
	readonly selectable: boolean;
	readonly mustPull: readonly string[];
};

// Strip secrets, derived relationship views, external foreign keys, and server-owned create metadata
// before artifacts reach disk. Settings' masked encrypted values must never overwrite target credentials.
const RESOURCE_LIST = [
	{
		name: 'users',
		collection: 'directus_users',
		endpoint: '/users',
		primaryKey: 'id',
		primaryKeyType: 'uuid',
		singleton: false,
		selectable: true,
		mustPull: ['roles', 'policies'],
		strip: ['password', 'token', 'tfa_secret', 'auth_data', 'last_access', 'last_page', 'avatar'],
		aliases: [],
		naturalKey: ['email'],
		fkFields: [{ field: 'role', references: 'directus_roles' }],
	},
	{
		name: 'roles',
		collection: 'directus_roles',
		endpoint: '/roles',
		primaryKey: 'id',
		primaryKeyType: 'uuid',
		singleton: false,
		selectable: true,
		mustPull: ['policies'],
		strip: [],
		aliases: ['users', 'children', 'policies'],
		naturalKey: ['name'],
		fkFields: [{ field: 'parent', references: 'directus_roles' }],
	},
	{
		name: 'policies',
		collection: 'directus_policies',
		endpoint: '/policies',
		primaryKey: 'id',
		primaryKeyType: 'uuid',
		singleton: false,
		selectable: true,
		mustPull: ['access', 'permissions'],
		strip: [],
		aliases: ['users', 'roles', 'permissions'],
		naturalKey: ['name'],
		fkFields: [],
	},
	{
		name: 'access',
		collection: 'directus_access',
		endpoint: '/access',
		primaryKey: 'id',
		primaryKeyType: 'uuid',
		singleton: false,
		selectable: false,
		mustPull: [],
		strip: [],
		aliases: [],
		// A grant is the triple it joins; role and user are alternatives, so both belong to the key.
		naturalKey: ['role', 'user', 'policy'],
		fkFields: [
			{ field: 'role', references: 'directus_roles' },
			{ field: 'policy', references: 'directus_policies' },
			{ field: 'user', references: 'directus_users' },
		],
	},
	{
		name: 'permissions',
		collection: 'directus_permissions',
		endpoint: '/permissions',
		primaryKey: 'id',
		primaryKeyType: 'integer',
		singleton: false,
		selectable: false,
		mustPull: [],
		strip: [],
		aliases: [],
		naturalKey: ['policy', 'collection', 'action'],
		fkFields: [{ field: 'policy', references: 'directus_policies' }],
		// Derived app-access permissions are runtime state, not importable records.
		drop: (record: Record<string, unknown>): boolean => record['system'] === true,
		// Filtering happens after offset pagination, so permissions require keyset paging and a count check.
		keyset: true,
		verifyCount: true,
	},
	{
		name: 'flows',
		collection: 'directus_flows',
		endpoint: '/flows',
		primaryKey: 'id',
		primaryKeyType: 'uuid',
		singleton: false,
		selectable: true,
		mustPull: ['operations'],
		strip: ['user_created', 'date_created'],
		aliases: ['operations'],
		naturalKey: ['name'],
		fkFields: [{ field: 'operation', references: 'directus_operations' }],
	},
	{
		name: 'operations',
		collection: 'directus_operations',
		endpoint: '/operations',
		primaryKey: 'id',
		primaryKeyType: 'uuid',
		singleton: false,
		selectable: false,
		mustPull: [],
		strip: ['user_created', 'date_created'],
		aliases: [],
		// Keys are unique per flow, so the flow that owns the operation is part of its identity.
		naturalKey: ['flow', 'key'],
		fkFields: [
			{ field: 'flow', references: 'directus_flows' },
			{ field: 'resolve', references: 'directus_operations' },
			{ field: 'reject', references: 'directus_operations' },
		],
	},
	{
		name: 'dashboards',
		collection: 'directus_dashboards',
		endpoint: '/dashboards',
		primaryKey: 'id',
		primaryKeyType: 'uuid',
		singleton: false,
		selectable: true,
		mustPull: ['panels'],
		strip: ['user_created', 'date_created'],
		aliases: ['panels'],
		naturalKey: ['name'],
		fkFields: [],
	},
	{
		name: 'panels',
		collection: 'directus_panels',
		endpoint: '/panels',
		primaryKey: 'id',
		primaryKeyType: 'uuid',
		singleton: false,
		selectable: false,
		mustPull: [],
		strip: ['user_created', 'date_created'],
		aliases: [],
		// Panels intentionally have no natural key: nothing about a panel is stable across instances.
		fkFields: [{ field: 'dashboard', references: 'directus_dashboards' }],
	},
	{
		name: 'settings',
		collection: 'directus_settings',
		endpoint: '/settings',
		primaryKey: 'id',
		primaryKeyType: 'integer',
		singleton: true,
		selectable: true,
		mustPull: [],
		strip: [
			'project_logo',
			'public_foreground',
			'public_background',
			'public_favicon',
			'storage_default_folder',
			'license_key',
			'license_token',
			'ai_openai_api_key',
			'ai_anthropic_api_key',
			'ai_google_api_key',
			'ai_openai_compatible_api_key',
			'ai_openai_compatible_headers',
		],
		aliases: [],
		// The singleton is its own identity: an empty key matches the one source row to the one target row.
		naturalKey: [],
		fkFields: [{ field: 'public_registration_role', references: 'directus_roles' }],
	},
	{
		// Folder parents require the same self-referential remapping as roles.
		name: 'folders',
		collection: 'directus_folders',
		endpoint: '/folders',
		primaryKey: 'id',
		primaryKeyType: 'uuid',
		singleton: false,
		selectable: true,
		mustPull: [],
		strip: [],
		aliases: [],
		naturalKey: ['name'],
		fkFields: [{ field: 'parent', references: 'directus_folders' }],
	},
	{
		name: 'translations',
		collection: 'directus_translations',
		endpoint: '/translations',
		primaryKey: 'id',
		primaryKeyType: 'uuid',
		singleton: false,
		selectable: true,
		mustPull: [],
		strip: [],
		aliases: [],
		naturalKey: ['language', 'key'],
		fkFields: [],
	},
] as const;

type SelectableEntry = Extract<(typeof RESOURCE_LIST)[number], { selectable: true }>;

/** A resource name users may select directly. */
export type SelectableResource = SelectableEntry['name'];

// The list keeps its literal names so flags and help text can be typed against them (which rules out
// `satisfies` on the list itself — isolatedDeclarations cannot infer through it). This lookup is where each
// entry is checked against ResourceDef, so an incomplete resource — or an integer-PK resource declaring no
// natural key, which the push could not import without risking an overwrite — fails to compile here.
const RESOURCES: Record<string, ResourceDef> = Object.fromEntries(RESOURCE_LIST.map((def) => [def.name, def] as const));

/** Sorted resource names users may select directly. */
export const SELECTABLE_RESOURCES: readonly SelectableResource[] = RESOURCE_LIST.filter(
	(def): def is SelectableEntry => def.selectable,
)
	.map((def) => def.name)
	.sort(byCodepoint);

/** What each selectable resource actually brings, for the help text of its flag. */
export const RESOURCE_FLAG_PHRASES: Record<SelectableResource, string> = {
	dashboards: 'dashboards and their panels',
	flows: 'flows and their operations',
	folders: 'media-library folders (the folder tree, not the files)',
	policies: 'access policies with their permissions and access rules',
	roles: 'roles (brings their policies)',
	settings: 'project settings',
	translations: 'custom translations',
	users: 'user accounts (brings roles and policies)',
};

function resource(name: string): ResourceDef {
	const def = RESOURCES[name];

	if (def === undefined) throw new Error(`resources: undefined edge target "${name}"`);

	return def;
}

function toResource(def: ResourceDef): Resource {
	const { selectable: _selectable, mustPull: _mustPull, ...resource } = def;
	return resource;
}

function parentOf(name: string): string {
	return RESOURCE_LIST.filter((def) => def.mustPull.some((dep) => dep === name))
		.map((def) => def.name)
		.sort(byCodepoint)
		.join(', ');
}

function dependencyOrder(closure: Set<string>): ResourceDef[] {
	const remaining = new Set(closure);
	const emitted = new Set<string>();
	const ordered: ResourceDef[] = [];

	while (remaining.size > 0) {
		const ready = [...remaining]
			.filter((name) => resource(name).mustPull.every((dep) => !closure.has(dep) || emitted.has(dep)))
			.sort(byCodepoint);

		const next = ready[0];

		if (next === undefined) throw new Error('resources: dependency cycle');

		ordered.push(resource(next));
		emitted.add(next);
		remaining.delete(next);
	}

	return ordered;
}

/** Expand selected resources and return them in deterministic dependency order. */
export function resolveResources(requested: string[], options?: { deps?: boolean }): Resource[] {
	const deps = options?.deps ?? true;

	for (const name of requested) {
		const def = RESOURCES[name];

		if (def === undefined) {
			throw new CliError('USAGE', `Unknown resource "${name}".`, {
				hint: `Selectable resources: ${SELECTABLE_RESOURCES.join(', ')}.`,
			});
		}

		if (!def.selectable) {
			throw new CliError('USAGE', `"${name}" is pulled automatically; select "${parentOf(name)}" instead.`);
		}
	}

	// --no-deps omits selectable dependencies, never a parent's dependent children.
	const closure = new Set<string>();
	const stack = [...requested];

	while (stack.length > 0) {
		const name = stack.pop();

		if (name === undefined || closure.has(name)) continue;

		closure.add(name);

		for (const dep of resource(name).mustPull) {
			if (!deps && resource(dep).selectable) continue;
			stack.push(dep);
		}
	}

	return dependencyOrder(closure).map(toResource);
}

/** Return the full resource graph in dependency order. */
export function allResources(): Resource[] {
	return resolveResources([...SELECTABLE_RESOURCES]);
}
