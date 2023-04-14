import { expect, describe, test, vi } from 'vitest';
import { getAccountabilityForRole } from './get-accountability-for-role.js';

vi.mock('./get-permissions', () => ({
	getPermissions: vi.fn().mockReturnValue([]),
}));

function mockDatabase() {
	const self: Record<string, any> = {
		select: vi.fn(() => self),
		from: vi.fn(() => self),
		where: vi.fn(() => self),
		first: vi.fn(),
	};

	return self;
}

describe('getAccountabilityForRole', async () => {
	test('no role', async () => {
		const result = await getAccountabilityForRole(null, {
			accountability: null,
			schema: {} as any,
			database: vi.fn() as any,
		});

		expect(result).toStrictEqual({
			admin: false,
			app: false,
			permissions: [],
			role: null,
			user: null,
		});
	});

	test('system role', async () => {
		const result = await getAccountabilityForRole('system', {
			accountability: null,
			schema: {} as any,
			database: vi.fn() as any,
		});

		expect(result).toStrictEqual({
			admin: true,
			app: true,
			permissions: [],
			role: null,
			user: null,
		});
	});

	test('get role from database', async () => {
		const db = mockDatabase();

		db['first'].mockReturnValue({
			admin_access: 'not true',
			app_access: '1',
		});

		const result = await getAccountabilityForRole('123-456', {
			accountability: null,
			schema: {} as any,
			database: db as any,
		});

		expect(result).toStrictEqual({
			admin: false,
			app: true,
			permissions: [],
			role: '123-456',
			user: null,
		});
	});

	test('database invalid role', async () => {
		const db = mockDatabase();
		db['first'].mockReturnValue(false);

		expect(() =>
			getAccountabilityForRole('456-789', {
				accountability: null,
				schema: {} as any,
				database: db as any,
			})
		).rejects.toThrow('Configured role "456-789" isn\'t a valid role ID or doesn\'t exist.');
	});
});
