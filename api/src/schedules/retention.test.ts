import knex from 'knex';
import { createTracker, MockClient } from 'knex-mock-client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	env: {} as Record<string, unknown>,
	getDatabase: vi.fn(),
	lock: {
		delete: vi.fn().mockResolvedValue(undefined),
		get: vi.fn().mockResolvedValue(undefined),
		set: vi.fn().mockResolvedValue(undefined),
	},
	logger: {
		error: vi.fn(),
		warn: vi.fn(),
	},
	getMaxBindings: vi.fn().mockReturnValue(Infinity),
	scheduleSynchronizedJob: vi.fn(),
	validateCron: vi.fn().mockReturnValue(true),
}));

vi.mock('@directus/env', () => ({
	useEnv: vi.fn(() => mocks.env),
}));

vi.mock('../database/helpers/index.js', () => ({
	getHelpers: vi.fn(() => ({
		date: { parse: vi.fn((date: Date) => date) },
		capabilities: { getMaxBindings: mocks.getMaxBindings },
	})),
}));

vi.mock('../database/index.js', () => ({
	default: mocks.getDatabase,
}));

vi.mock('../lock/index.js', () => ({
	useLock: vi.fn(() => mocks.lock),
}));

vi.mock('../logger/index.js', () => ({
	useLogger: vi.fn(() => mocks.logger),
}));

vi.mock('../utils/schedule.js', () => ({
	scheduleSynchronizedJob: mocks.scheduleSynchronizedJob,
	validateCron: mocks.validateCron,
}));

const db = vi.mocked(knex.default({ client: MockClient }));
const tracker = createTracker(db);

beforeEach(() => {
	vi.resetModules();

	for (const key of Object.keys(mocks.env)) {
		delete mocks.env[key];
	}

	Object.assign(mocks.env, {
		ACTIVITY_RETENTION: '1d',
		FLOW_LOGS_RETENTION: undefined,
		RETENTION_BATCH: 100,
		RETENTION_ENABLED: true,
		RETENTION_SCHEDULE: '0 0 * * *',
		REVISIONS_RETENTION: undefined,
	});

	mocks.getDatabase.mockReturnValue(db);
	mocks.getMaxBindings.mockReturnValue(Infinity);
	mocks.validateCron.mockReturnValue(true);
});

afterEach(() => {
	tracker.reset();
	vi.clearAllMocks();
});

describe('retention', () => {
	test('Returns early when retention is disabled', async () => {
		mocks.env['RETENTION_ENABLED'] = false;
		const { default: retentionSchedule } = await import('./retention.js');

		const res = await retentionSchedule();

		expect(mocks.validateCron).not.toHaveBeenCalled();
		expect(res).toBe(false);
	});

	test('Returns early for invalid retention schedule', async () => {
		mocks.env['RETENTION_SCHEDULE'] = '#';
		mocks.validateCron.mockReturnValue(false);
		const { default: retentionSchedule } = await import('./retention.js');

		const res = await retentionSchedule();

		expect(mocks.validateCron).toHaveBeenCalledWith('#');
		expect(res).toBe(false);
	});

	test('Schedules synchronized job', async () => {
		const { handleRetentionJob, default: retentionSchedule } = await import('./retention.js');

		await retentionSchedule();

		expect(mocks.validateCron).toHaveBeenCalledWith('0 0 * * *');
		expect(mocks.scheduleSynchronizedJob).toHaveBeenCalledWith('retention', '0 0 * * *', handleRetentionJob);
	});

	test('Returns true on successful init', async () => {
		const { default: retentionSchedule } = await import('./retention.js');

		const res = await retentionSchedule();

		expect(res).toBe(true);
	});

	test('nulls revision parents before deleting activities', async () => {
		const { handleRetentionJob } = await import('./retention.js');

		tracker.on.select('directus_activity').responseOnce([{ id: 10 }]);
		tracker.on.select('directus_revisions').responseOnce([{ id: 20 }]);
		tracker.on.update('directus_revisions').responseOnce(1);
		tracker.on.delete('directus_activity').responseOnce(1);

		await handleRetentionJob();

		expect(tracker.history.select[1]?.sql).toBe('select "id" from "directus_revisions" where "activity" in (?)');
		expect(tracker.history.select[1]?.bindings).toEqual([10]);
		expect(tracker.history.update).toHaveLength(1);
		expect(tracker.history.update[0]?.sql).toBe('update "directus_revisions" set "parent" = ? where "parent" in (?)');
		expect(tracker.history.update[0]?.bindings).toEqual([null, 20]);
		expect(tracker.history.delete[0]?.sql).toBe('delete from "directus_activity" where "id" in (?)');
		expect(tracker.history.delete[0]?.bindings).toEqual([10]);

		expect(tracker.history.all.indexOf(tracker.history.update[0]!)).toBeLessThan(
			tracker.history.all.indexOf(tracker.history.delete[0]!),
		);
	});

	test('nulls revision parents before deleting revisions directly', async () => {
		mocks.env['ACTIVITY_RETENTION'] = undefined;
		mocks.env['REVISIONS_RETENTION'] = '1d';
		const { handleRetentionJob, default: retentionSchedule } = await import('./retention.js');

		await retentionSchedule();

		tracker.on.select('directus_revisions').responseOnce([{ id: 20 }]);
		tracker.on.update('directus_revisions').responseOnce(1);
		tracker.on.delete('directus_revisions').responseOnce(1);

		await handleRetentionJob();

		expect(tracker.history.update).toHaveLength(1);
		expect(tracker.history.update[0]?.sql).toBe('update "directus_revisions" set "parent" = ? where "parent" in (?)');
		expect(tracker.history.update[0]?.bindings).toEqual([null, 20]);
		expect(tracker.history.delete[0]?.sql).toBe('delete from "directus_revisions" where "id" in (?)');
		expect(tracker.history.delete[0]?.bindings).toEqual([20]);

		expect(tracker.history.all.indexOf(tracker.history.update[0]!)).toBeLessThan(
			tracker.history.all.indexOf(tracker.history.delete[0]!),
		);
	});

	test('skips the parent-nulling update when activities have no revisions', async () => {
		const { handleRetentionJob } = await import('./retention.js');

		tracker.on.select('directus_activity').responseOnce([{ id: 10 }]);
		tracker.on.select('directus_revisions').responseOnce([]);
		tracker.on.delete('directus_activity').responseOnce(1);

		await handleRetentionJob();

		expect(tracker.history.update).toHaveLength(0);
		expect(tracker.history.delete).toHaveLength(1);
		expect(tracker.history.delete[0]?.bindings).toEqual([10]);
	});

	test('stops without deleting when there are no records left', async () => {
		const { handleRetentionJob } = await import('./retention.js');

		tracker.on.select('directus_activity').responseOnce([]);

		await handleRetentionJob();

		expect(tracker.history.select).toHaveLength(1);
		expect(tracker.history.transactions).toHaveLength(0);
		expect(tracker.history.update).toHaveLength(0);
		expect(tracker.history.delete).toHaveLength(0);
	});

	test('keeps deleting batches until a batch is not full', async () => {
		mocks.env['RETENTION_BATCH'] = 2;
		const { handleRetentionJob } = await import('./retention.js');

		tracker.on.select('directus_activity').responseOnce([{ id: 10 }, { id: 11 }]);
		tracker.on.select('directus_activity').responseOnce([{ id: 12 }]);
		tracker.on.select('directus_revisions').response([]);
		tracker.on.delete('directus_activity').responseOnce(2);
		tracker.on.delete('directus_activity').responseOnce(1);

		await handleRetentionJob();

		expect(tracker.history.delete).toHaveLength(2);
		expect(tracker.history.delete[0]?.bindings).toEqual([10, 11]);
		expect(tracker.history.delete[1]?.bindings).toEqual([12]);
		expect(mocks.lock.set).toHaveBeenCalledTimes(3);
	});

	test('rolls back the parent-nulling update when the delete fails', async () => {
		const { handleRetentionJob } = await import('./retention.js');

		tracker.on.select('directus_activity').responseOnce([{ id: 10 }]);
		tracker.on.select('directus_revisions').responseOnce([{ id: 20 }]);
		tracker.on.update('directus_revisions').responseOnce(1);
		tracker.on.delete('directus_activity').simulateErrorOnce('delete failed');

		await handleRetentionJob();

		expect(tracker.history.update).toHaveLength(1);
		expect(tracker.history.transactions).toHaveLength(1);
		expect(tracker.history.transactions[0]?.state).toBe('rolled back');
		expect(mocks.logger.error).toHaveBeenCalled();
	});

	test('caps the batch size at the database binding limit', async () => {
		mocks.env['RETENTION_BATCH'] = 5000;
		mocks.getMaxBindings.mockReturnValue(1000);
		const { handleRetentionJob, default: retentionSchedule } = await import('./retention.js');

		await retentionSchedule();

		expect(mocks.logger.warn).toHaveBeenCalledWith(
			'"RETENTION_BATCH" exceeds the maximum of 999 supported by the database, using 999 instead',
		);

		tracker.on.select('directus_activity').responseOnce([]);

		await handleRetentionJob();

		expect(tracker.history.select[0]?.bindings).toContain(999);
	});

	test('keeps the batch size when within the database binding limit', async () => {
		mocks.getMaxBindings.mockReturnValue(1000);
		const { handleRetentionJob, default: retentionSchedule } = await import('./retention.js');

		await retentionSchedule();

		expect(mocks.logger.warn).not.toHaveBeenCalled();

		tracker.on.select('directus_activity').responseOnce([]);

		await handleRetentionJob();

		expect(tracker.history.select[0]?.bindings).toContain(100);
	});
});
