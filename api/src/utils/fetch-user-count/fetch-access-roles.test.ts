import { type Knex } from 'knex';
import { beforeEach, expect, test, vi } from 'vitest';
import { fetchAccessRoles } from './fetch-access-roles.js';

let knex: Knex;

beforeEach(() => {
	vi.clearAllMocks();

	knex = {
		select: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		whereNotNull: vi.fn().mockReturnThis(),
		whereNotIn: vi.fn(),
	} as unknown as Knex;
});

test('Returns the full admin and app access roles if no nested roles are found', async () => {
	const options = {
		adminRoles: new Set(['admin']),
		appRoles: new Set(['app']),
	};

	vi.mocked(knex.whereNotIn).mockResolvedValue([]);

	const result = await fetchAccessRoles(options, { knex });

	expect(result).toEqual(options);
});

test('Returns the correct admin and app access roles if a roles parent grants both admin and app access', async () => {
	const options = {
		adminRoles: new Set(['role-a']),
		appRoles: new Set(['role-a']),
	};

	vi.mocked(knex.whereNotIn).mockResolvedValue([{ id: 'role-b', parent: 'role-a' }]);

	const result = await fetchAccessRoles(options, { knex });

	expect(result).toEqual({
		adminRoles: new Set(['role-a', 'role-b']),
		appRoles: new Set(['role-a', 'role-b']),
	});
});

test('Excludes roles that are passed in the excludeRoles option in the query', async () => {
	const options = {
		adminRoles: new Set([]),
		appRoles: new Set([]),
		excludeRoles: ['role-a'],
	};

	vi.mocked(knex.whereNotIn).mockResolvedValue([]);

	await fetchAccessRoles(options, { knex });

	expect(knex.whereNotIn).toHaveBeenCalledWith('id', ['role-a']);
});

test('Does not add an unrelated role to the admin or app roles', async () => {
	const options = {
		adminRoles: new Set(['admin']),
		appRoles: new Set(['app']),
	};

	vi.mocked(knex.whereNotIn).mockResolvedValue([{ id: 'role-a', parent: 'unrelated' }]);

	const result = await fetchAccessRoles(options, { knex });

	expect(result).toEqual(options);
});

test.each([
	[
		[{ id: 'role-a', parent: 'admin' }],
		{
			adminRoles: new Set(['admin', 'role-a']),
			appRoles: new Set(['app']),
		},
	],
	[
		[{ id: 'role-a', parent: 'app' }],
		{
			adminRoles: new Set(['admin']),
			appRoles: new Set(['app', 'role-a']),
		},
	],
	[
		[
			{ id: 'role-a', parent: 'role-b' },
			{ id: 'role-b', parent: 'admin' },
		],
		{
			adminRoles: new Set(['admin', 'role-a', 'role-b']),
			appRoles: new Set(['app']),
		},
	],
	[
		[
			{ id: 'role-a', parent: 'role-b' },
			{ id: 'role-b', parent: 'app' },
		],
		{
			adminRoles: new Set(['admin']),
			appRoles: new Set(['app', 'role-a', 'role-b']),
		},
	],
])('Returns the correct admin and app access roles when roles are nested', async (queryReturn, expected) => {
	const options = {
		adminRoles: new Set(['admin']),
		appRoles: new Set(['app']),
	};

	vi.mocked(knex.whereNotIn).mockResolvedValue(queryReturn);

	const result = await fetchAccessRoles(options, { knex });

	expect(result).toEqual(expected);
});
