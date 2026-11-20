import type { LicenseResolvedItems } from '@directus/types';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getDatabaseClient } from '../../database/index.js';
import { SettingsService } from '../../services/settings.js';
import { readResolvedItems, updateResolvedItems } from './store.js';

const db = vi.hoisted(() => ({ value: null as LicenseResolvedItems | null, lock: Promise.resolve() }));

const query = vi.hoisted(() => {
	const builder = { select: vi.fn(), forUpdate: vi.fn(), first: vi.fn() };
	builder.select.mockReturnValue(builder);
	builder.forUpdate.mockResolvedValue([]);
	builder.first.mockResolvedValue(undefined);
	return builder;
});

const trx = vi.hoisted(() =>
	Object.assign(
		vi.fn(() => query),
		{ isTransaction: true },
	),
);

vi.mock('../../database/index.js', () => ({
	getDatabase: vi.fn(() => ({})),
	getDatabaseClient: vi.fn(() => 'postgres'),
}));

vi.mock('../../utils/get-schema.js', () => ({ getSchema: vi.fn() }));

vi.mock('../../utils/transaction.js', () => ({
	transaction: vi.fn(async (_knex: unknown, handler: (trx: unknown) => Promise<unknown>) => {
		const previous = db.lock;
		let release!: () => void;
		db.lock = new Promise((resolve) => (release = resolve));
		await previous;

		try {
			return await handler(trx);
		} finally {
			release();
		}
	}),
}));

vi.mock('../../services/settings.js', () => ({
	SettingsService: vi.fn(function () {
		return {
			readSingleton: vi.fn(async () => {
				await new Promise((resolve) => setTimeout(resolve, 1));
				return { resolved_items: db.value };
			}),
			upsertSingleton: vi.fn(async (data: { resolved_items: LicenseResolvedItems }) => {
				db.value = data.resolved_items;
			}),
		};
	}),
}));

beforeEach(() => {
	db.value = null;
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('updateResolvedItems', () => {
	test('reads and writes inside one transaction without accountability', async () => {
		await updateResolvedItems(() => ({ flows: [{ id: 'f1', resolved_at: 'now' }] }));

		expect(SettingsService).toHaveBeenCalledWith(expect.objectContaining({ knex: trx, accountability: null }));
		expect(db.value).toEqual({ flows: [{ id: 'f1', resolved_at: 'now' }] });
	});

	test('two concurrent updates both persist', async () => {
		await Promise.all([
			updateResolvedItems((current) => ({ ...current, flows: [{ id: 'f1', resolved_at: 'now' }] })),
			updateResolvedItems((current) => ({ ...current, seats: [{ id: 'u1', resolved_at: 'now' }] })),
		]);

		expect(db.value).toEqual({
			flows: [{ id: 'f1', resolved_at: 'now' }],
			seats: [{ id: 'u1', resolved_at: 'now' }],
		});
	});

	test('locks the settings row before reading', async () => {
		await updateResolvedItems((current) => current ?? {});

		expect(trx).toHaveBeenCalledWith('directus_settings');
		expect(query.forUpdate).toHaveBeenCalled();
		// Oracle rejects FOR UPDATE inside the subquery that first()/limit() produce
		expect(query.first).not.toHaveBeenCalled();
	});

	test('skips the row lock on sqlite', async () => {
		vi.mocked(getDatabaseClient).mockReturnValueOnce('sqlite');

		await updateResolvedItems((current) => current ?? {});

		expect(query.forUpdate).not.toHaveBeenCalled();
	});
});

describe('readResolvedItems', () => {
	test('returns null when nothing is recorded', async () => {
		await expect(readResolvedItems()).resolves.toBeNull();
	});
});
