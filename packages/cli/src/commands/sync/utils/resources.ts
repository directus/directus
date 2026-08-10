import { CliError } from '../../../kernel/error.js';
import { byCodepoint } from './codepoint.js';

export interface FkField {
	readonly field: string;
	/** The collection the field points at. */
	readonly references: string;
}

interface ResourceFields {
	readonly name: string;
	readonly singular: string;
	readonly plural: string;
	readonly collection: string;
	readonly endpoint: string;
	/** Data Studio item route; omitted when the resource has no stable one. */
	readonly appRoute?: string | undefined;
	readonly primaryKey: string;
	readonly singleton: boolean;
	readonly strip: readonly string[];
	readonly aliases: readonly string[];
	/** The FKs that survive a pull, derived from `packages/system-data/src/relations/relations.yaml`. */
	readonly fkFields: readonly FkField[];
	/** Matches records the server derives at read time; they are never persisted, so pull drops them. */
	readonly drop?: ((record: Record<string, unknown>) => boolean) | undefined;
	/** Page by PK cursor. Integer-PK endpoints only: the query validator forbids _gt on uuid fields. */
	readonly keyset?: boolean | undefined;
	/** Check the fetched count against total_count. For endpoints whose reads can be silently filtered. */
	readonly verifyCount?: boolean | undefined;
}

/**
 * `naturalKey` names the fields that identify the same record across instances with different primary
 * keys; omitting it means the resource has no stable cross-instance identity and is never reconciled.
 *
 * An integer PK must declare one, because the target may have handed that auto-increment key to an
 * unrelated record. A uuid is globally unique, safe to send verbatim, and may go unkeyed.
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
		singular: 'user',
		plural: 'users',
		collection: 'directus_users',
		endpoint: '/users',
		appRoute: '/admin/users',
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
		singular: 'role',
		plural: 'roles',
		collection: 'directus_roles',
		endpoint: '/roles',
		appRoute: '/admin/settings/roles',
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
		singular: 'policy',
		plural: 'policies',
		collection: 'directus_policies',
		endpoint: '/policies',
		appRoute: '/admin/settings/policies',
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
		singular: 'access rule',
		plural: 'access rules',
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
		singular: 'permission',
		plural: 'permissions',
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
		singular: 'flow',
		plural: 'flows',
		collection: 'directus_flows',
		endpoint: '/flows',
		appRoute: '/admin/settings/flows',
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
		singular: 'operation',
		plural: 'operations',
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
		singular: 'dashboard',
		plural: 'dashboards',
		collection: 'directus_dashboards',
		endpoint: '/dashboards',
		appRoute: '/admin/insights',
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
		singular: 'panel',
		plural: 'panels',
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
		singular: 'settings record',
		plural: 'settings records',
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
		// The singleton is its own identity: an empty key matches the one source record to the one target record.
		naturalKey: [],
		fkFields: [{ field: 'public_registration_role', references: 'directus_roles' }],
	},
	{
		// Folder parents require the same self-referential remapping as roles.
		name: 'folders',
		singular: 'folder',
		plural: 'folders',
		collection: 'directus_folders',
		endpoint: '/folders',
		appRoute: '/admin/files/folders',
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
		singular: 'translation',
		plural: 'translations',
		collection: 'directus_translations',
		endpoint: '/translations',
		appRoute: '/admin/settings/translations',
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

export type SelectableResource = SelectableEntry['name'];

// The list keeps its literal names so flags and help text can be typed against them, which rules out
// `satisfies` on the list itself (isolatedDeclarations cannot infer through it). This lookup is where an
// entry is checked against ResourceDef, so a malformed resource fails to compile here.
const RESOURCES: Record<string, ResourceDef> = Object.fromEntries(RESOURCE_LIST.map((def) => [def.name, def] as const));

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

/** Expands to the dependency closure, in deterministic order. */
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

export function allResources(): Resource[] {
	return resolveResources([...SELECTABLE_RESOURCES]);
}
