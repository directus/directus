import { CliError } from '../kernel/error.js';
import { byCodepoint } from './codepoint.js';

/** A syncable Directus system resource and its export rules. */
export interface Resource {
	readonly name: string;
	readonly collection: string;
	readonly endpoint: string;
	readonly primaryKey: string;
	readonly singleton: boolean;
	readonly strip: readonly string[];
	readonly aliases: readonly string[];
}

interface ResourceDef extends Resource {
	readonly selectable: boolean;
	readonly mustPull: readonly string[];
}

// Endpoints are the routers mounted in api/src/app.ts; every system collection keys on `id` (verified
// against api/src/database seeds and the create-table migrations); directus_settings is the lone
// singleton (packages/system-data collections.yaml: `singleton: true`).
//
// `strip` removes secrets, out-of-scope FKs, and login churn — including settings' encrypt-special key
// fields, which read back as the masked literal "**********" and would re-encrypt that literal over the
// target's real credential on import (settings.license_key/license_token are additionally refused
// outright by the settings service, failing the whole batch). `aliases` removes relationship views whose
// linkage already ships as child rows. Both are deleted before data reaches disk.
const RESOURCE_LIST: readonly ResourceDef[] = [
	{
		name: 'users',
		collection: 'directus_users',
		endpoint: '/users',
		primaryKey: 'id',
		singleton: false,
		selectable: true,
		mustPull: ['roles', 'policies'],
		strip: ['password', 'token', 'tfa_secret', 'auth_data', 'last_access', 'last_page', 'avatar'],
		aliases: [],
	},
	{
		name: 'roles',
		collection: 'directus_roles',
		endpoint: '/roles',
		primaryKey: 'id',
		singleton: false,
		selectable: true,
		mustPull: ['policies'],
		strip: [],
		aliases: ['users', 'children', 'policies'],
	},
	{
		name: 'policies',
		collection: 'directus_policies',
		endpoint: '/policies',
		primaryKey: 'id',
		singleton: false,
		selectable: true,
		mustPull: ['access', 'permissions'],
		strip: [],
		aliases: ['users', 'roles', 'permissions'],
	},
	{
		name: 'access',
		collection: 'directus_access',
		endpoint: '/access',
		primaryKey: 'id',
		singleton: false,
		selectable: false,
		mustPull: [],
		strip: [],
		aliases: [],
	},
	{
		name: 'permissions',
		collection: 'directus_permissions',
		endpoint: '/permissions',
		primaryKey: 'id',
		singleton: false,
		selectable: false,
		mustPull: [],
		strip: [],
		aliases: [],
	},
	{
		name: 'flows',
		collection: 'directus_flows',
		endpoint: '/flows',
		primaryKey: 'id',
		singleton: false,
		selectable: true,
		mustPull: ['operations'],
		strip: ['user_created'],
		aliases: ['operations'],
	},
	{
		name: 'operations',
		collection: 'directus_operations',
		endpoint: '/operations',
		primaryKey: 'id',
		singleton: false,
		selectable: false,
		mustPull: [],
		strip: ['user_created'],
		aliases: [],
	},
	{
		name: 'dashboards',
		collection: 'directus_dashboards',
		endpoint: '/dashboards',
		primaryKey: 'id',
		singleton: false,
		selectable: true,
		mustPull: ['panels'],
		strip: ['user_created'],
		aliases: ['panels'],
	},
	{
		name: 'panels',
		collection: 'directus_panels',
		endpoint: '/panels',
		primaryKey: 'id',
		singleton: false,
		selectable: false,
		mustPull: [],
		strip: ['user_created'],
		aliases: [],
	},
	{
		name: 'settings',
		collection: 'directus_settings',
		endpoint: '/settings',
		primaryKey: 'id',
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
	},
	{
		name: 'translations',
		collection: 'directus_translations',
		endpoint: '/translations',
		primaryKey: 'id',
		singleton: false,
		selectable: true,
		mustPull: [],
		strip: [],
		aliases: [],
	},
];

const RESOURCES: Record<string, ResourceDef> = Object.fromEntries(RESOURCE_LIST.map((def) => [def.name, def]));

/** Sorted resource names users may select directly. */
export const SELECTABLE_RESOURCES: string[] = RESOURCE_LIST.filter((def) => def.selectable)
	.map((def) => def.name)
	.sort(byCodepoint);

// A missing edge target is a static table defect, not user input.
function resource(name: string): ResourceDef {
	const def = RESOURCES[name];

	if (def === undefined) throw new Error(`resources: undefined edge target "${name}"`);

	return def;
}

function toResource(def: ResourceDef): Resource {
	return {
		name: def.name,
		collection: def.collection,
		endpoint: def.endpoint,
		primaryKey: def.primaryKey,
		singleton: def.singleton,
		strip: def.strip,
		aliases: def.aliases,
	};
}

function parentOf(name: string): string {
	return RESOURCE_LIST.filter((def) => def.mustPull.includes(name))
		.map((def) => def.name)
		.sort(byCodepoint)
		.join(', ');
}

// Deterministic topological order: dependencies first, then codepoint-smallest among ready resources.
function dependencyOrder(closure: Set<string>): ResourceDef[] {
	const remaining = new Set(closure);
	const emitted = new Set<string>();
	const ordered: ResourceDef[] = [];

	while (remaining.size > 0) {
		// Dependencies omitted by --no-deps cannot block this closure's ordering.
		const ready = [...remaining]
			.filter((name) => resource(name).mustPull.every((dep) => !closure.has(dep) || emitted.has(dep)))
			.sort(byCodepoint);

		const next = ready[0];

		// Unreachable for this static acyclic graph; a cycle would leave every remaining node blocked.
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

	// deps:false omits selectable dependencies, but dependent-only children always ride with their parent.
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
