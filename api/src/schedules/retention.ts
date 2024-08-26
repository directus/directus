import { Action } from '@directus/constants';
import { useEnv } from '@directus/env';
import { toBoolean } from '@directus/utils';
import type { Knex } from 'knex';
import getDatabase from '../database/index.js';
import { useLock } from '../lock/index.js';
import { useLogger } from '../logger/index.js';
import { getMilliseconds } from '../utils/get-milliseconds.js';
import { scheduleSynchronizedJob, validateCron } from '../utils/schedule.js';

export interface RetentionTask {
	collection: string;
	where?: readonly [string, string, Knex.Value | null];
	join?: readonly [string, string, string];
	timeframe?: number;
}

const env = useEnv();

const retentionLockKey = 'schedule--data-retention';
const retentionLockTimeout = 10 * 60 * 1000; // 10 mins

const RETENTION_TASKS: RetentionTask[] = [
	{
		collection: 'directus_activity',
		where: ['action', '!=', Action.RUN],
		timeframe: getMilliseconds(env['ACTIVITY_RETENTION']),
	},
	{
		collection: 'directus_activity',
		where: ['action', '=', Action.RUN],
		timeframe: getMilliseconds(env['FLOW_LOGS_RETENTION']),
	},
	{
		collection: 'directus_revisions',
		join: ['directus_activity', 'directus_revisions.activity', 'directus_activity.id'],
		timeframe: getMilliseconds(env['REVISIONS_RETENTION']),
	},
];

export async function handleRetentionJob() {
	const database = getDatabase();
	const logger = useLogger();
	const lock = useLock();
	const batch = Number(env['RETENTION_BATCH']);
	const lockTime = await lock.get(retentionLockKey);
	const now = Date.now();

	if (lockTime && Number(lockTime) > now - retentionLockTimeout) {
		// ensure only one connected process
		return;
	}

	await lock.set(retentionLockKey, Date.now());

	for (const task of RETENTION_TASKS) {
		let count = 0;

		if (task.timeframe === undefined) {
			// skip disabled tasks
			continue;
		}

		do {
			const subquery = database
				.queryBuilder()
				.select('id')
				.from(task.collection)
				.where('timestamp', '<', Date.now() - task.timeframe)
				.limit(batch);

			if (task.where) {
				subquery.where(...task.where);
			}

			if (task.join) {
				subquery.join(...task.join);
			}

			try {
				count = await database(task.collection).where('id', 'in', subquery).delete();
			} catch (error) {
				logger.error(error, `Retention failed for Collection ${task.collection}`);

				break;
			}

			// Update lock time to prevent concurrent runs
			await lock.set(retentionLockKey, Date.now());
		} while (count >= batch);
	}

	await lock.delete(retentionLockKey);
}

/**
 * Schedule the retention tracking
 *
 * @returns Whether or not telemetry has been initialized
 */
export default function schedule() {
	const env = useEnv();

	if (!toBoolean(env['RETENTION_ENABLED'])) {
		return false;
	}

	if (!validateCron(String(env['RETENTION_SCHEDULE']))) {
		return false;
	}

	scheduleSynchronizedJob('retention', String(env['RETENTION_SCHEDULE']), handleRetentionJob);

	return true;
}
