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
	},
	isOneOfClients: vi.fn().mockReturnValue(false),
	scheduleSynchronizedJob: vi.fn(),
	validateCron: vi.fn().mockReturnValue(true),
}));

vi.mock('@directus/env', () => ({
	useEnv: vi.fn(() => mocks.env),
}));

vi.mock('../database/helpers/index.js', () => ({
	getHelpers: vi.fn(() => ({
		date: { parse: vi.fn((date: Date) => date) },
		schema: { isOneOfClients: mocks.isOneOfClients },
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
	mocks.isOneOfClients.mockReturnValue(false);
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
		mocks.isOneOfClients.mockReturnValue(true);
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
});
