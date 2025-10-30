import knex from 'knex';
import { createTracker, MockClient } from 'knex-mock-client';
import { afterEach, expect, test, vi } from 'vitest';
import * as schedule from '../utils/schedule.js';
import projectSchedule from './project.js';
import { sendReport } from '../telemetry/index.js';

// This is required because logger uses global env which is imported before the tests run. Can be
// reduce to just mock the file when logger is also using useLogger everywhere @TODO

vi.mock('../telemetry/index.js');

vi.spyOn(schedule, 'scheduleSynchronizedJob');
vi.spyOn(schedule, 'validateCron');

const db = vi.mocked(knex.default({ client: MockClient }));
const tracker = createTracker(db);

afterEach(() => {
	tracker.reset();
	vi.clearAllMocks();
});

test('Schedules synchronized job', async () => {
	tracker.on.select('directus_settings').response([]);

	await projectSchedule();

	expect(schedule.scheduleSynchronizedJob).toHaveBeenCalled();
});

test('Doesnt send report if not pending', async () => {
	vi.mocked(schedule.scheduleSynchronizedJob).mockImplementationOnce((_id, _rule, cb) => {
		cb(new Date());

		return undefined as any;
	});

	tracker.on.select('directus_settings').response([]);

	await projectSchedule();

	expect(vi.mocked(sendReport)).not.toHaveBeenCalledOnce();
});

test('Sends report when pending', async () => {
	vi.mocked(schedule.scheduleSynchronizedJob).mockImplementationOnce((_id, _rule, cb) => {
		cb(new Date());

		return undefined as any;
	});

	tracker.on.select('directus_settings').response([
		{
			project_status: 'pending',
		},
	]);

	await projectSchedule();

	expect(vi.mocked(sendReport)).toHaveBeenCalledOnce();
});
