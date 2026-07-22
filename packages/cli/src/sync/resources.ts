import { CliError } from '../kernel/error.js';
import { byCodepoint } from './codepoint.js';

// The system-resource dependency graph from the spec's Addendum, encoded as data. A pull SELECTS
// resources; each may "must-pull" further resources (its dependencies), and the graph's dependent-only
// children — access, permissions, operations, panels — are never selected directly: they ride in on
// their parent. resolveResources expands a selection to its transitive closure and orders it
// dependencies-first (the order the spec calls "bottom up"), the order the importer consumes.

export interface Resource {
	readonly name: string; // CLI-facing name, e.g. 'roles'
	readonly collection: string; // system collection, e.g. 'directus_roles'
	readonly endpoint: string; // REST path, e.g. '/roles'; settings is a singleton endpoint
	readonly primaryKey: string; // field records key on — 'id' for every system resource
	readonly singleton: boolean; // settings only: a single-object endpoint, not a collection
	readonly strip: readonly string[]; // fields deleted from every exported record (never on disk)
	readonly aliases: readonly string[]; // alias views of other collections' FKs; deleted on export too
}

// A resource plus its graph edges. `selectable` gates direct selection; `mustPull` names the resources
// this one drags in (its dependencies), each emitted before it in dependency order.
interface ResourceDef extends Resource {
	readonly selectable: boolean;
	readonly mustPull: readonly string[];
}

// Endpoints are the routers mounted in api/src/app.ts (/users, /roles, /policies, /access,
// /permissions, /flows, /operations, /dashboards, /panels, /settings, /translations). Every system
// collection keys on `id` (verified against api/src/database seeds and the create-table migrations);
// directus_settings is the lone singleton (packages/system-data collections.yaml: `singleton: true`).
//
// `strip` and `aliases` are both deleted from every exported record; the split is documentary. `strip`
// covers two categories (spec Q9): sensitive columns that must never touch disk — users.password/token/
// tfa_secret, users.auth_data (OAuth refresh credentials), and settings' encrypt-special key fields,
// which read back as the masked literal "**********" and would re-encrypt that literal over the target's
// real credential on import (settings.license_key/license_token are additionally refused outright by the
// settings service, failing the whole batch) — and external references that would break a fresh-target
// import: FKs to out-of-scope collections (user_created, settings.*_logo/favicon/…, users.avatar) plus
// login-churn fields (users.last_access/last_page) that would dirty config PRs forever. `aliases` are the
// third category:
// they are not real columns but views of other collections' FKs (roles.users, policies.permissions,
// flows.operations, …); the linkage ships as real rows on the child collection, so the alias view is
// dropped rather than duplicated. date_created and project_url are deliberately KEPT — a synced value
// should read identical on both instances.
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

/**
 * The selectable names, sorted, for help text and error copy. The dependent-only children are excluded
 * so they can never be offered as a valid choice.
 */
export const SELECTABLE_RESOURCES: string[] = RESOURCE_LIST.filter((def) => def.selectable)
	.map((def) => def.name)
	.sort(byCodepoint);

// Every graph edge names a resource defined in RESOURCE_LIST above, so a lookup that misses is a table
// error in this module, never user input — fail as such rather than returning undefined.
function resource(name: string): ResourceDef {
	const def = RESOURCES[name];

	if (def === undefined) throw new Error(`resources: undefined edge target "${name}"`);

	return def;
}

// Strip the graph-only fields so the public surface is exactly the Resource shape.
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

// The parent(s) a dependent-only child rides in on: whichever resources must-pull it. Every child in
// the graph has exactly one, but derive it so the error copy stays correct if the table grows.
function parentOf(name: string): string {
	return RESOURCE_LIST.filter((def) => def.mustPull.includes(name))
		.map((def) => def.name)
		.sort(byCodepoint)
		.join(', ');
}

// The lexicographically minimal topological order over the must-pull edges: a resource is emitted only
// once every resource it must-pull is already emitted (dependencies first, "bottom up"), and among the
// resources then eligible the codepoint-smallest wins. The result is fully determined by the closure,
// independent of the order names were requested in.
function dependencyOrder(closure: Set<string>): ResourceDef[] {
	const remaining = new Set(closure);
	const emitted = new Set<string>();
	const ordered: ResourceDef[] = [];

	while (remaining.size > 0) {
		// A dep only gates ordering when it is itself in the closure: --no-deps can drop a selectable dep
		// from the closure, and requiring an absent dep would deadlock this walk into a false "cycle".
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

export function resolveResources(requested: string[], options?: { deps?: boolean }): Resource[] {
	const deps = options?.deps ?? true;

	for (const name of requested) {
		const def = RESOURCES[name];

		if (def === undefined) {
			throw new CliError('USAGE', `Unknown resource "${name}".`, {
				hint: `Selectable resources: ${SELECTABLE_RESOURCES.join(', ')}.`,
			});
		}

		// Dependent-only children are pulled with their parent, never chosen on their own (spec: "Does
		// not allow selection of dependent collections (e.g. panels), expected to select parent").
		if (!def.selectable) {
			throw new CliError('USAGE', `"${name}" is pulled automatically; select "${parentOf(name)}" instead.`);
		}
	}

	// Transitive closure over must-pull edges, deduplicated: the requested resources plus everything
	// they drag in. Closure BETWEEN selectable resources (users→roles/policies, roles→policies) is
	// opt-out via deps:false (RFC --no-deps); an edge to a non-selectable, dependent-only child
	// (policies→access/permissions, flows→operations, dashboards→panels) is selection semantics, not
	// closure — that parent→child ride is never severed, so those edges are always followed.
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

/**
 * The entire resource graph in dependency order: every selectable resource expanded to its full closure.
 * The whole-graph idiom callers use to enumerate config resources — telling a config resource from a
 * content collection, or walking every graph member — factored out so `resolveResources([...SELECTABLE_
 * RESOURCES])` is written in one place rather than re-spelled at each call.
 */
export function allResources(): Resource[] {
	return resolveResources([...SELECTABLE_RESOURCES]);
}
