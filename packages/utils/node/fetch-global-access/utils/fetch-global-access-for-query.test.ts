import { fetchGlobalAccessForQuery } from './fetch-global-access-for-query.js';
import type { Accountability } from '@directus/types';
import type { Knex } from 'knex';
import { beforeEach, expect, test, vi } from 'vitest';

let qb: Knex.QueryBuilder;

beforeEach(() => {
	vi.clearAllMocks();

	qb = {
		select: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		leftJoin: vi.fn().mockResolvedValue([]),
	} as unknown as Knex.QueryBuilder;
});

test('Returns false by default if no access is found', async () => {
	const res = await fetchGlobalAccessForQuery(qb, {} as Accountability);

	expect(res).toEqual({
		app: false,
		admin: false,
	});
});

test('Sets app true if one or more access rows have app access set as true', async () => {
	vi.mocked(qb.leftJoin).mockResolvedValue([
		{ admin_access: false, app_access: false },
		{ admin_access: false, app_access: true },
		{ admin_access: false, app_access: false },
	]);

	const res = await fetchGlobalAccessForQuery(qb, {} as Accountability);

	expect(res).toEqual({ admin: false, app: true });
});

test('Sets admin & app true if one or more access rows have app admin set as true', async () => {
	vi.mocked(qb.leftJoin).mockResolvedValue([
		{ admin_access: false, app_access: false },
		{ admin_access: true, app_access: false },
		{ admin_access: false, app_access: false },
	]);

	const res = await fetchGlobalAccessForQuery(qb, {} as Accountability);

	expect(res).toEqual({ admin: true, app: true });
});

test('Sets app true if one or more access rows have app access set as 1', async () => {
	vi.mocked(qb.leftJoin).mockResolvedValue([
		{ admin_access: 0, app_access: 0 },
		{ admin_access: 0, app_access: 1 },
		{ admin_access: 0, app_access: 0 },
	]);

	const res = await fetchGlobalAccessForQuery(qb, {} as Accountability);

	expect(res).toEqual({ admin: false, app: true });
});

test('Sets admin & app true if one or more access rows have app admin set as true', async () => {
	vi.mocked(qb.leftJoin).mockResolvedValue([
		{ admin_access: 0, app_access: 0 },
		{ admin_access: 1, app_access: 0 },
		{ admin_access: 0, app_access: 0 },
	]);

	const res = await fetchGlobalAccessForQuery(qb, {} as Accountability);

	expect(res).toEqual({ admin: true, app: true });
});

test('Includes policies that have an ip access restriction that does matches the accountability ip', async () => {
	vi.mocked(qb.leftJoin).mockResolvedValue([
		{ admin_access: false, app_access: false },
		{ admin_access: false, app_access: true, ip_access: '127.0.0.1/24,127.0.0.2' },
	]);

	const res = await fetchGlobalAccessForQuery(qb, { ip: '127.0.0.5' } as Accountability);

	expect(res).toEqual({ admin: false, app: true });
});

test('Ignores policies that have an ip access restriction that does not match the accountability ip', async () => {
	vi.mocked(qb.leftJoin).mockResolvedValue([
		{ admin_access: false, app_access: false },
		{ admin_access: true, app_access: false, ip_access: '127.0.0.1,127.0.0.2' },
		{ admin_access: false, app_access: true, ip_access: '128.0.0.1' },
	]);

	const res = await fetchGlobalAccessForQuery(qb, { ip: '1.1.1.1' } as Accountability);

	expect(res).toEqual({ admin: false, app: false });
});
