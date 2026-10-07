import { Action } from '@directus/constants';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import getDatabase from '../database/index.js';
import { useLogger } from '../logger/index.js';
import { resetEnv, setEnv } from '../test-utils/env.js';
import { createMockKnex } from '../test-utils/knex.js';
import { createMockLogger } from '../test-utils/logger.js';
import retentionSchedule, { handleRetentionJob, type RetentionTask } from './retention.js';

const mocks = vi.hoisted(() => ({
	getMaxBindings: vi.fn(),
	runExclusive: vi.fn(async (_key: string, fn: () => unknown) => ({ result: await fn(), leader: true })),
	scheduleSynchronizedJob: vi.fn(),
	validateCron: vi.fn(),
}));

vi.mock('@directus/env', async () => {
	const { mockEnv } = await import('../test-utils/env.js');

	return mockEnv({
		ACTIVITY_RETENTION: '1d',
		FLOW_LOGS_RETENTION: undefined,
		RETENTION_BATCH: 100,
		RETENTION_ENABLED: true,
		REVISIONS_RETENTION: undefined,
	});
});

vi.mock('../database/index.js', async () => {
	const { mockDatabase } = await import('../test-utils/database.js');
	return mockDatabase();
});

vi.mock('../database/helpers/index.js', () => ({
	getHelpers: vi.fn(() => ({
		date: { parse: vi.fn((date: Date) => date) },
		capabilities: { getMaxBindings: mocks.getMaxBindings },
	})),
}));

vi.mock('../logger/index.js');

vi.mock('../utils/run-exclusive.js', () => ({
	runExclusive: mocks.runExclusive,
}));

vi.mock('../utils/schedule.js', () => ({
	scheduleSynchronizedJob: mocks.scheduleSynchronizedJob,
	validateCron: mocks.validateCron,
}));

const { db, tracker } = createMockKnex();

let logger: ReturnType<typeof createMockLogger>;

const activityTask: RetentionTask = {
	collection: 'directus_activity',
	where: ['directus_activity.action', '!=', Action.RUN],
	timeframe: 86_400_000,
};

const revisionsTask: RetentionTask = {
	collection: 'directus_revisions',
	join: ['directus_activity', 'directus_revisions.activity', 'directus_activity.id'],
	timeframe: 86_400_000,
};

/** Run the job registered by the last `schedule()` call */
function runScheduledJob() {
	return mocks.scheduleSynchronizedJob.mock.calls.at(-1)![2]();
}

beforeEach(() => {
	resetEnv();

	logger = createMockLogger();
	vi.mocked(useLogger).mockReturnValue(logger as any);
	vi.mocked(getDatabase).mockReturnValue(db);

	mocks.getMaxBindings.mockReturnValue(Infinity);
	mocks.validateCron.mockReturnValue(true);
});

afterEach(() => {
	tracker.reset();
	vi.clearAllMocks();
	vi.useRealTimers();
});

test.each([
	{ reason: 'retention is disabled', env: { RETENTION_ENABLED: false } },
	{
		reason: 'the schedule is invalid',
		env: { RETENTION_SCHEDULE: '#' },
		validCron: false,
		log: ['error', 'Invalid RETENTION_SCHEDULE: "#". Retention disabled.'],
	},
	...['abc', 0, -5, 1.5].map((value) => ({
		reason: `the batch is ${value}`,
		env: { RETENTION_BATCH: value },
		log: ['error', `Invalid RETENTION_BATCH: "${value}". Retention disabled.`],
	})),
	{
		reason: 'no retention timeframes are set',
		env: { ACTIVITY_RETENTION: undefined },
		log: ['warn', 'No retention timeframes are set. Retention disabled.'],
	},
] as { reason: string; env: Record<string, unknown>; validCron?: boolean; log?: ['error' | 'warn', string] }[])(
	'Does not schedule when $reason',
	async ({ env, validCron = true, log }) => {
		setEnv(env);
		mocks.validateCron.mockReturnValue(validCron);

		const res = await retentionSchedule();

		if (log) expect(logger[log[0]]).toHaveBeenCalledWith(log[1]);
		expect(mocks.scheduleSynchronizedJob).not.toHaveBeenCalled();
		expect(res).toBe(false);
	},
);

test('Schedules synchronized job', async () => {
	const res = await retentionSchedule();

	expect(mocks.scheduleSynchronizedJob).toHaveBeenCalledWith('retention', '0 0 * * *', expect.any(Function));
	expect(res).toBe(true);
});

test('runs retention exclusively across instances', async () => {
	await retentionSchedule();

	tracker.on.select('directus_activity').responseOnce([]);

	await runScheduledJob();

	expect(mocks.runExclusive).toHaveBeenCalledWith('retention', expect.any(Function), { timeout: 3_600_000 });
});

test('logs when the exclusive run fails', async () => {
	const error = new Error('lock unavailable');

	mocks.runExclusive.mockRejectedValueOnce(error);

	await retentionSchedule();
	await runScheduledJob();

	expect(logger.error).toHaveBeenCalledWith(error, 'Retention run failed');
});

const activityQuery = '"directus_activity"."action" != ?';
const flowLogsQuery = '"directus_activity"."action" = ?';
const revisionsQuery = 'from "directus_revisions"';

test.each([
	{ reason: 'only activity retention is set', env: {}, queries: [activityQuery] },
	{
		reason: 'only flow logs retention is set',
		env: { ACTIVITY_RETENTION: undefined, FLOW_LOGS_RETENTION: '1d' },
		queries: [flowLogsQuery],
	},
	{
		reason: 'activity retention is disabled',
		env: { ACTIVITY_RETENTION: undefined, REVISIONS_RETENTION: '30d' },
		queries: [revisionsQuery],
	},
	{
		reason: 'revisions expire before their activity',
		env: { ACTIVITY_RETENTION: '30d', REVISIONS_RETENTION: '1d' },
		queries: [activityQuery, revisionsQuery],
	},
	{
		reason: 'revisions expire after their activity',
		env: { ACTIVITY_RETENTION: '1d', REVISIONS_RETENTION: '30d' },
		queries: [activityQuery],
	},
])('Runs the expected tasks when $reason', async ({ env, queries }) => {
	setEnv(env);

	await retentionSchedule();

	tracker.on.select(/./).response([]);

	await runScheduledJob();

	expect(tracker.history.select).toHaveLength(queries.length);

	queries.forEach((query, index) => {
		expect(tracker.history.select[index]?.sql).toContain(query);
	});
});

test.each([
	{ configured: 5000, used: 999, warns: true },
	{ configured: 100, used: 100, warns: false },
])('Uses a batch of $used when $configured is configured with a limit of 1000', async ({ configured, used, warns }) => {
	setEnv({ RETENTION_BATCH: configured });
	mocks.getMaxBindings.mockReturnValue(1000);

	await retentionSchedule();

	if (warns) {
		expect(logger.warn).toHaveBeenCalledWith(
			`"RETENTION_BATCH" value ${configured} exceeds the database limit. Using the maximum allowed value of ${used}`,
		);
	} else {
		expect(logger.warn).not.toHaveBeenCalled();
	}

	tracker.on.select('directus_activity').responseOnce([]);

	await runScheduledJob();

	expect(tracker.history.select[0]?.bindings).toContain(used);
});

test('selects records older than the task timeframe', async () => {
	vi.useFakeTimers({ toFake: ['Date'] });
	vi.setSystemTime(new Date('2026-01-02T00:00:00.000Z'));

	tracker.on.select(/./).response([]);

	await handleRetentionJob([activityTask, revisionsTask], 100);

	expect(tracker.history.select).toHaveLength(2);

	for (const select of tracker.history.select) {
		expect(select.sql).toContain('"directus_activity"."timestamp" < ?');
		expect(select.bindings).toContainEqual(new Date('2026-01-01T00:00:00.000Z'));
	}
});

test('nulls revision parents before deleting activities', async () => {
	tracker.on.select('directus_activity').responseOnce([{ id: 10 }]);
	tracker.on.select('directus_revisions').responseOnce([{ id: 20 }]);
	tracker.on.update('directus_revisions').responseOnce(1);
	tracker.on.delete('directus_activity').responseOnce(1);

	await handleRetentionJob([activityTask], 100);

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
	tracker.on.select('directus_revisions').responseOnce([{ id: 20 }]);
	tracker.on.update('directus_revisions').responseOnce(1);
	tracker.on.delete('directus_revisions').responseOnce(1);

	await handleRetentionJob([revisionsTask], 100);

	expect(tracker.history.update).toHaveLength(1);
	expect(tracker.history.update[0]?.sql).toBe('update "directus_revisions" set "parent" = ? where "parent" in (?)');
	expect(tracker.history.update[0]?.bindings).toEqual([null, 20]);
	expect(tracker.history.delete[0]?.sql).toBe('delete from "directus_revisions" where "id" in (?)');
	expect(tracker.history.delete[0]?.bindings).toEqual([20]);

	expect(tracker.history.all.indexOf(tracker.history.update[0]!)).toBeLessThan(
		tracker.history.all.indexOf(tracker.history.delete[0]!),
	);
});

test('chunks the parent-nulling update when activities have more revisions than the batch', async () => {
	tracker.on.select('directus_activity').responseOnce([{ id: 10 }, { id: 11 }]);
	tracker.on.select('directus_activity').responseOnce([]);
	tracker.on.select('directus_revisions').responseOnce([{ id: 20 }, { id: 21 }, { id: 22 }]);
	tracker.on.update('directus_revisions').response(1);
	tracker.on.delete('directus_activity').responseOnce(2);

	await handleRetentionJob([activityTask], 2);

	expect(tracker.history.update.map((update) => update.bindings)).toEqual([
		[null, 20, 21],
		[null, 22],
	]);
});

test('skips the parent-nulling update when activities have no revisions', async () => {
	tracker.on.select('directus_activity').responseOnce([{ id: 10 }]);
	tracker.on.select('directus_revisions').responseOnce([]);
	tracker.on.delete('directus_activity').responseOnce(1);

	await handleRetentionJob([activityTask], 100);

	expect(tracker.history.update).toHaveLength(0);
	expect(tracker.history.delete).toHaveLength(1);
	expect(tracker.history.delete[0]?.bindings).toEqual([10]);
});

test('stops without deleting when there are no records left', async () => {
	tracker.on.select('directus_activity').responseOnce([]);

	await handleRetentionJob([activityTask], 100);

	expect(tracker.history.select).toHaveLength(1);
	expect(tracker.history.transactions).toHaveLength(0);
	expect(tracker.history.update).toHaveLength(0);
	expect(tracker.history.delete).toHaveLength(0);
});

test('keeps deleting batches until a batch is not full', async () => {
	tracker.on.select('directus_activity').responseOnce([{ id: 10 }, { id: 11 }]);
	tracker.on.select('directus_activity').responseOnce([{ id: 12 }]);
	tracker.on.select('directus_revisions').response([]);
	tracker.on.delete('directus_activity').responseOnce(2);
	tracker.on.delete('directus_activity').responseOnce(1);

	await handleRetentionJob([activityTask], 2);

	expect(tracker.history.delete).toHaveLength(2);
	expect(tracker.history.delete[0]?.bindings).toEqual([10, 11]);
	expect(tracker.history.delete[1]?.bindings).toEqual([12]);
	expect(logger.debug).toHaveBeenCalledWith('Retention deleted 3 rows');
});

test('keeps going after a full batch even when fewer rows were deleted', async () => {
	tracker.on.select('directus_activity').responseOnce([{ id: 10 }, { id: 11 }]);
	tracker.on.select('directus_activity').responseOnce([]);
	tracker.on.select('directus_revisions').response([]);
	tracker.on.delete('directus_activity').responseOnce(1);

	await handleRetentionJob([activityTask], 2);

	expect(tracker.history.select.filter((select) => select.sql.includes('from "directus_activity"'))).toHaveLength(2);
});

test('continues with the next task when one fails', async () => {
	tracker.on.select(/from "directus_activity"/).simulateErrorOnce('select failed');
	tracker.on.select(/from "directus_revisions"/).responseOnce([]);

	await handleRetentionJob([activityTask, revisionsTask], 100);

	expect(logger.error).toHaveBeenCalledWith(
		expect.objectContaining({ message: expect.stringContaining('select failed') }),
		'Retention failed for collection directus_activity',
	);

	expect(tracker.history.select).toHaveLength(2);
	expect(tracker.history.select[1]?.sql).toContain('from "directus_revisions"');
});

test('rolls back the parent-nulling update when the delete fails', async () => {
	tracker.on.select('directus_activity').responseOnce([{ id: 10 }]);
	tracker.on.select('directus_revisions').responseOnce([{ id: 20 }]);
	tracker.on.update('directus_revisions').responseOnce(1);
	tracker.on.delete('directus_activity').simulateErrorOnce('delete failed');

	await handleRetentionJob([activityTask], 100);

	expect(tracker.history.update).toHaveLength(1);
	expect(tracker.history.transactions).toHaveLength(1);
	expect(tracker.history.transactions[0]?.state).toBe('rolled back');

	expect(logger.error).toHaveBeenCalledWith(
		expect.objectContaining({ message: expect.stringContaining('delete failed') }),
		'Retention failed for collection directus_activity',
	);
});
