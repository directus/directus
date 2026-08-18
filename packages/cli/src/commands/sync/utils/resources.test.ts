import { systemRelationRows } from '@directus/system-data';
import { describe, expect, it } from 'vitest';
import { allResources, resolveResources, SELECTABLE_RESOURCES } from './resources.js';
import { expectCliError } from './test-support.js';

function names(requested: string[], options?: { deps?: boolean }): string[] {
	return resolveResources(requested, options).map((resource) => resource.name);
}

describe('resolveResources', () => {
	it('pins every selectable closure — the checked form of the hand-maintained mustPull mapping', () => {
		const closures = Object.fromEntries(SELECTABLE_RESOURCES.map((name) => [name, names([name])]));

		expect(closures).toEqual({
			dashboards: ['panels', 'dashboards'],
			flows: ['operations', 'flows'],
			folders: ['folders'],
			policies: ['access', 'permissions', 'policies'],
			roles: ['access', 'permissions', 'policies', 'roles'],
			settings: ['settings'],
			translations: ['translations'],
			users: ['access', 'permissions', 'policies', 'roles', 'users'],
		});
	});

	it('produces one deterministic order for the whole selection, dependencies first', () => {
		const all = ['dashboards', 'flows', 'folders', 'policies', 'roles', 'settings', 'translations', 'users'];

		expect(names(all)).toEqual([
			'access',
			'folders',
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
		const error = expectCliError(() => resolveResources(['panels']));

		expect(error.code).toBe('USAGE');
		expect(error.message).toContain('panels');
		expect(error.message).toContain('dashboards');
	});

	it('rejects an unknown resource, listing the selectable names', () => {
		const error = expectCliError(() => resolveResources(['widgets']));

		expect(error.code).toBe('USAGE');
		expect(error.hint).toContain('users');
		expect(error.hint).toContain('dashboards');
	});

	it('marks settings the lone singleton and leaves it standalone', () => {
		expect(resolveResources(['settings'])).toEqual([
			{
				name: 'settings',
				singular: 'settings record',
				plural: 'settings records',
				collection: 'directus_settings',
				endpoint: '/settings',
				primaryKey: 'id',
				primaryKeyType: 'integer',
				singleton: true,
				naturalKey: [],
				fkFields: [{ field: 'public_registration_role', references: 'directus_roles' }],
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
		]);
	});

	it('follows a selectable-to-selectable edge by default but severs it under deps:false', () => {
		expect(names(['roles'])).toEqual(['access', 'permissions', 'policies', 'roles']);
		expect(names(['roles'], { deps: false })).toEqual(['roles']);
	});

	it('keeps dependent-only children riding with their parent even under deps:false', () => {
		expect(names(['policies'], { deps: false })).toEqual(['access', 'permissions', 'policies']);
	});

	it('pins the users strip list by value — a new secret-bearing account column must fail loudly', () => {
		const users = resolveResources(['users']).find((resource) => resource.name === 'users');

		expect(users?.strip).toEqual([
			'password',
			'token',
			'tfa_secret',
			'auth_data',
			'last_access',
			'last_page',
			'avatar',
		]);
	});

	it('leaves panels the lone resource without a cross-instance identity', () => {
		const keyless = allResources()
			.filter((resource) => resource.naturalKey === undefined)
			.map((resource) => resource.collection);

		expect(keyless).toEqual(['directus_panels']);
	});

	it('pins the auto-increment resources — a mis-declared primary key sends raw source ids at the target', () => {
		const autoIncrement = allResources()
			.filter((resource) => resource.primaryKeyType === 'integer')
			.map((resource) => resource.collection);

		expect(autoIncrement).toEqual(['directus_permissions', 'directus_settings']);
	});

	it('offers only the selectable names, sorted, never the dependent-only children', () => {
		expect(SELECTABLE_RESOURCES).toEqual([
			'dashboards',
			'flows',
			'folders',
			'policies',
			'roles',
			'settings',
			'translations',
			'users',
		]);
	});
});

describe('fkFields drift pin', () => {
	const synced = new Map(allResources().map((resource) => [resource.collection, resource]));

	function edge(collection: string, field: string, references: string): string {
		return `${collection}.${field} → ${references}`;
	}

	const known = allResources().flatMap((resource) =>
		resource.fkFields.map((fk) => edge(resource.collection, fk.field, fk.references)),
	);

	it('lists only foreign keys the server actually declares', () => {
		const declared = new Set(
			systemRelationRows
				.filter((row) => typeof row.one_collection === 'string')
				.map((row) => edge(row.many_collection, row.many_field, row.one_collection as string)),
		);

		expect(known.filter((entry) => !declared.has(entry))).toEqual([]);
	});

	it('lists every pull-surviving foreign key between synced collections', () => {
		const missing = systemRelationRows
			.filter((row) => {
				const owner = synced.get(row.many_collection);

				if (owner === undefined || typeof row.one_collection !== 'string' || !synced.has(row.one_collection)) {
					return false;
				}

				return !owner.strip.includes(row.many_field) && !owner.aliases.includes(row.many_field);
			})
			.map((row) => edge(row.many_collection, row.many_field, row.one_collection as string))
			.filter((entry) => !known.includes(entry));

		expect(missing).toEqual([]);
	});
});
