import { describe, expect, it } from 'vitest';
import { CliError } from '../kernel/error.js';
import { resolveResources, SELECTABLE_RESOURCES } from './resources.js';

function names(requested: string[], options?: { deps?: boolean }): string[] {
	return resolveResources(requested, options).map((resource) => resource.name);
}

function expectCliError(fn: () => unknown): CliError {
	try {
		fn();
	} catch (error) {
		expect(error).toBeInstanceOf(CliError);
		return error as CliError;
	}

	throw new Error('expected a CliError');
}

describe('resolveResources', () => {
	it('pulls the policy chain and emits every dependency before the resource that pulls it', () => {
		// The importer consumes this order bottom up: users must-pull roles and policies, roles pull
		// policies, policies pull their access and permissions children. Emitting a resource before
		// something it must-pull would hand the importer a parent whose required rows are absent.
		expect(names(['users'])).toEqual(['access', 'permissions', 'policies', 'roles', 'users']);
	});

	it('auto-pulls a dashboard’s panels and emits panels before the dashboard', () => {
		// Panels are a dependent-only child: selecting a dashboard must drag its panels in, ordered ahead
		// of it, without the caller ever naming panels.
		expect(names(['dashboards'])).toEqual(['panels', 'dashboards']);
	});

	it('produces one deterministic order for the whole selection, dependencies first', () => {
		// This exact sequence is the module's contract: the lexicographically minimal topological order
		// over the must-pull edges. Locking it here makes any reordering — from a graph edit or a sort
		// regression — fail loudly instead of silently changing the import plan committed to a repo.
		const all = ['dashboards', 'flows', 'policies', 'roles', 'settings', 'translations', 'users'];

		expect(names(all)).toEqual([
			'access',
			'operations',
			'flows',
			'panels',
			'dashboards',
			'permissions',
			'policies',
			'roles',
			'settings',
			'translations',
			'users',
		]);
	});

	it('resolves the same order however the selection is ordered or duplicated', () => {
		// The order is a property of the graph, not of the request: two spellings of one selection must
		// produce identical import plans, and a repeated name must not duplicate a resource.
		expect(names(['users', 'flows', 'flows'])).toEqual(names(['flows', 'users']));

		expect(names(['flows', 'users'])).toEqual([
			'access',
			'operations',
			'flows',
			'permissions',
			'policies',
			'roles',
			'users',
		]);
	});

	it('rejects a directly requested dependent-only child, naming its parent', () => {
		// Spec: "Does not allow selection of dependent collections (e.g. panels), expected to select
		// parent (e.g. dashboard)." The error must name the parent so the user knows what to pick instead.
		const error = expectCliError(() => resolveResources(['panels']));

		expect(error.code).toBe('USAGE');
		expect(error.message).toContain('panels');
		expect(error.message).toContain('dashboards');
	});

	it('rejects an unknown resource, listing the selectable names', () => {
		// A typo or an unsupported collection must fail with the menu of valid choices, not silently
		// resolve to nothing.
		const error = expectCliError(() => resolveResources(['widgets']));

		expect(error.code).toBe('USAGE');
		expect(error.hint).toContain('users');
		expect(error.hint).toContain('dashboards');
	});

	it('marks settings the lone singleton and leaves it standalone', () => {
		// directus_settings is a single-object endpoint (system-data collections.yaml: singleton) that
		// pulls nothing, so a settings selection resolves to exactly itself — carrying its external-reference
		// strip list (project logo/favicon and storage_default_folder FKs) and no alias views.
		expect(resolveResources(['settings'])).toEqual([
			{
				name: 'settings',
				collection: 'directus_settings',
				endpoint: '/settings',
				primaryKey: 'id',
				singleton: true,
				strip: ['project_logo', 'public_foreground', 'public_background', 'public_favicon', 'storage_default_folder'],
				aliases: [],
			},
		]);
	});

	it('follows a selectable-to-selectable edge by default but severs it under deps:false', () => {
		// Closure between selectable resources is opt-out (RFC --no-deps): with deps on, roles drags in its
		// policies (and their access/permissions children); with deps off, the selectable edge roles→policies
		// is severed and roles resolves to itself alone.
		expect(names(['roles'])).toEqual(['access', 'permissions', 'policies', 'roles']);
		expect(names(['roles'], { deps: false })).toEqual(['roles']);
	});

	it('keeps dependent-only children riding with their parent even under deps:false', () => {
		// The parent→child edge (policies→access/permissions) is selection semantics, not closure, so
		// --no-deps never severs it: selecting policies alone still exports its access and permissions rows.
		expect(names(['policies'], { deps: false })).toEqual(['access', 'permissions', 'policies']);
	});

	it('gives every resource a strip and an aliases list, so a new resource cannot forget them', () => {
		// The strip/alias tables are the export's secrets-and-FK guard: a resource added without them would
		// silently ship sensitive columns or break a fresh-target import. Loop so the invariant is total.
		const all = ['dashboards', 'flows', 'policies', 'roles', 'settings', 'translations', 'users'];

		for (const resource of resolveResources(all)) {
			expect(Array.isArray(resource.strip)).toBe(true);
			expect(Array.isArray(resource.aliases)).toBe(true);
		}
	});

	it('offers only the selectable names, sorted, never the dependent-only children', () => {
		// Help text and error copy read from this list; access/permissions/operations/panels must never
		// appear as a choice a user could select directly.
		expect(SELECTABLE_RESOURCES).toEqual([
			'dashboards',
			'flows',
			'policies',
			'roles',
			'settings',
			'translations',
			'users',
		]);
	});
});
