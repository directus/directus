import { CliError } from '../kernel/error.js';

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
const RESOURCE_LIST: readonly ResourceDef[] = [
	{
		name: 'users',
		collection: 'directus_users',
		endpoint: '/users',
		primaryKey: 'id',
		singleton: false,
		selectable: true,
		mustPull: ['roles', 'policies'],
	},
	{
		name: 'roles',
		collection: 'directus_roles',
		endpoint: '/roles',
		primaryKey: 'id',
		singleton: false,
		selectable: true,
		mustPull: ['policies'],
	},
	{
		name: 'policies',
		collection: 'directus_policies',
		endpoint: '/policies',
		primaryKey: 'id',
		singleton: false,
		selectable: true,
		mustPull: ['access', 'permissions'],
	},
	{
		name: 'access',
		collection: 'directus_access',
		endpoint: '/access',
		primaryKey: 'id',
		singleton: false,
		selectable: false,
		mustPull: [],
	},
	{
		name: 'permissions',
		collection: 'directus_permissions',
		endpoint: '/permissions',
		primaryKey: 'id',
		singleton: false,
		selectable: false,
		mustPull: [],
	},
	{
		name: 'flows',
		collection: 'directus_flows',
		endpoint: '/flows',
		primaryKey: 'id',
		singleton: false,
		selectable: true,
		mustPull: ['operations'],
	},
	{
		name: 'operations',
		collection: 'directus_operations',
		endpoint: '/operations',
		primaryKey: 'id',
		singleton: false,
		selectable: false,
		mustPull: [],
	},
	{
		name: 'dashboards',
		collection: 'directus_dashboards',
		endpoint: '/dashboards',
		primaryKey: 'id',
		singleton: false,
		selectable: true,
		mustPull: ['panels'],
	},
	{
		name: 'panels',
		collection: 'directus_panels',
		endpoint: '/panels',
		primaryKey: 'id',
		singleton: false,
		selectable: false,
		mustPull: [],
	},
	{
		name: 'settings',
		collection: 'directus_settings',
		endpoint: '/settings',
		primaryKey: 'id',
		singleton: true,
		selectable: true,
		mustPull: [],
	},
	{
		name: 'translations',
		collection: 'directus_translations',
		endpoint: '/translations',
		primaryKey: 'id',
		singleton: false,
		selectable: true,
		mustPull: [],
	},
];

const RESOURCES: Record<string, ResourceDef> = Object.fromEntries(RESOURCE_LIST.map((def) => [def.name, def]));

// Codepoint comparison, never localeCompare/Intl (see the schema store): locale ordering varies by
// machine, so neither the dependency order nor the sorted name lists may depend on it. Written as
// statements rather than a nested ternary to satisfy the repo's no-nested-ternary rule.
function byCodepoint(a: string, b: string): number {
	if (a < b) return -1;
	if (a > b) return 1;
	return 0;
}

// The selectable names, sorted, for help text and error copy. The dependent-only children are excluded
// so they can never be offered as a valid choice.
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
		const ready = [...remaining]
			.filter((name) => resource(name).mustPull.every((dep) => emitted.has(dep)))
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

export function resolveResources(requested: string[]): Resource[] {
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
	// they drag in.
	const closure = new Set<string>();
	const stack = [...requested];

	while (stack.length > 0) {
		const name = stack.pop();

		if (name === undefined || closure.has(name)) continue;

		closure.add(name);

		for (const dep of resource(name).mustPull) stack.push(dep);
	}

	return dependencyOrder(closure).map(toResource);
}
