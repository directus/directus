import knex from 'knex';
import { createTracker, MockClient } from 'knex-mock-client';
import { afterEach, expect, test, vi } from 'vitest';
import { scheduleSynchronizedJob } from '../utils/schedule.js';
import projectSchedule from './project.js';
import { sendReport } from '../telemetry/index.js';
import getDatabase from '../database/index.js';

// This is required because logger uses global env which is imported before the tests run. Can be
// reduce to just mock the file when logger is also using useLogger everywhere @TODO

vi.mock('../database/index.js');
vi.mock('../telemetry/index.js');
vi.mock('../utils/schedule.js');

let callback: (date: Date) => Promise<void> | void;

const triggerCron = () => callback(new Date());

vi.mocked(scheduleSynchronizedJob).mockImplementation((_id, _rule, cb) => {
	callback = cb;

	return undefined as any;
});

const db = vi.mocked(knex.default({ client: MockClient }));
const tracker = createTracker(db);

vi.mocked(getDatabase).mockReturnValue(db);

afterEach(() => {
	tracker.reset();
	vi.clearAllMocks();
});

test('Schedules synchronized job', async () => {
	tracker.on.select('directus_settings').response([{ project_status: undefined }]);

	await projectSchedule();

	expect(scheduleSynchronizedJob).toHaveBeenCalled();
});

test('Doesnt send report if not pending', async () => {
	tracker.on.select('directus_settings').response([{ project_status: undefined }]);

	await projectSchedule();

	await triggerCron();

	expect(vi.mocked(sendReport)).not.toHaveBeenCalledOnce();
});

test('Doesnt send report if telemetry is disabled', async () => {
	vi.mocked(useEnv).mockReturnValue({ TELEMETRY: false });

	await projectSchedule();

	expect(vi.mocked(sendReport)).not.toHaveBeenCalledOnce();
});

test('Sends report when pending', async () => {
	tracker.on.select('directus_settings').response([
		{
			project_status: 'pending',
		},
	]);

	await projectSchedule();

	await triggerCron();

	expect(vi.mocked(sendReport)).toHaveBeenCalledOnce();
	expect(tracker.history.all[1]?.sql).toEqual('update "directus_settings" set "project_status" = ?');
	expect(tracker.history.all[1]?.bindings).toEqual(['']);
});

test('Doesnt reset project status when sending fails', async () => {
	tracker.on.select('directus_settings').response([
		{
			project_status: 'pending',
		},
	]);

	await projectSchedule();

	vi.mocked(sendReport).mockRejectedValue(new Error());

	await triggerCron();

	expect(vi.mocked(sendReport)).toHaveBeenCalledOnce();
	expect(tracker.history.all.length).toEqual(1);
});
