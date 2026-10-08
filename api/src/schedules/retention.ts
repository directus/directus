import { Action } from '@directus/constants';
import { useEnv } from '@directus/env';
import type { PrimaryKey } from '@directus/types';
import type { Knex } from 'knex';
import { chunk, isNil } from 'lodash-es';
import { getHelpers } from '../database/helpers/index.js';
import getDatabase from '../database/index.js';
import { useLogger } from '../logger/index.js';
import { runExclusive } from '../utils/run-exclusive.js';
import { scheduleSynchronizedJob, validateCron } from '../utils/schedule.js';
import { transaction } from '../utils/transaction.js';

export interface RetentionTask {
	collection: string;
	where?: readonly [string, string, Knex.Value | null];
	join?: readonly [string, string, string];
	timeframe: number;
}

export async function handleRetentionJob(tasks: RetentionTask[], batch: number) {
	const database = getDatabase();
	const logger = useLogger();
	const helpers = getHelpers(database);
	const deleted = { activities: 0, revisions: 0 };

	for (const task of tasks) {
		let records: PrimaryKey[] = [];

		do {
			const query = database
				.queryBuilder()
				.select(`${task.collection}.id`)
				.from(task.collection)
				.where('directus_activity.timestamp', '<', helpers.date.parse(new Date(Date.now() - task.timeframe)))
				.limit(batch);

			if (task.where) {
				query.where(...task.where);
			}

			if (task.join) {
				query.join(...task.join);
			}

			try {
				/**
				 * Fetch IDs up front so all subsequent queries operate on the same rows.
				 *
				 * Using a subquery could result in different rows being selected. It is also not supported by MySQL/MariaDB.
				 * https://dev.mysql.com/doc/refman/8.4/en/subquery-restrictions.html
				 */
				records = await query.then((r) => r.map((r) => r.id));

				if (records.length === 0) {
					break;
				}

				const removed = await transaction(database, async (trx) => {
					let revisionIds = records;

					// deleting an activity cascades to its revisions, look those up to clear any reference
					if (task.collection === 'directus_activity') {
						revisionIds = await trx('directus_revisions')
							.select('id')
							.whereIn('activity', records)
							.then((revisions) => revisions.map((revision) => revision.id));
					}

					// directus_revisions.parent has no on delete action, references to deleted revisions must be cleared first.
					// Chunking by batch to ensure update is within allowed limits
					for (const ids of chunk(revisionIds, batch)) {
						await trx('directus_revisions').update({ parent: null }).whereIn('parent', ids);
					}

					const count = await trx(task.collection).whereIn('id', records).delete();

					// revisions removed by the activity cascade are not part of the delete count
					return task.collection === 'directus_activity'
						? { activities: count, revisions: revisionIds.length }
						: { activities: 0, revisions: count };
				});

				deleted.activities += removed.activities;
				deleted.revisions += removed.revisions;
			} catch (error) {
				logger.error(error, `Retention failed for collection ${task.collection}`);

				break;
			}
		} while (records.length >= batch);
	}

	logger.debug(`Retention deleted ${deleted.activities} activities and ${deleted.revisions} revisions`);
}

/**
 * Schedule the retention tracking
 *
 * @returns Whether or not retention has been initialized
 */
export default async function schedule(): Promise<boolean> {
	const env = useEnv();
	const logger = useLogger();
	const cron = env.RETENTION_SCHEDULE;

	if (!env.RETENTION_ENABLED) {
		return false;
	}

	if (!validateCron(cron)) {
		logger.error(`Invalid RETENTION_SCHEDULE: "${cron}". Retention disabled.`);
		return false;
	}

	let batch = env.RETENTION_BATCH;

	if (!Number.isInteger(batch) || batch < 1) {
		logger.error(`Invalid RETENTION_BATCH: "${env.RETENTION_BATCH}". Retention disabled.`);
		return false;
	}

	const activityTimeframe = env.ACTIVITY_RETENTION;
	const flowLogsTimeframe = env.FLOW_LOGS_RETENTION;
	const revisionsTimeframe = env.REVISIONS_RETENTION;

	const tasks: RetentionTask[] = [];

	if (!isNil(activityTimeframe)) {
		tasks.push({
			collection: 'directus_activity',
			where: ['directus_activity.action', '!=', Action.RUN],
			timeframe: activityTimeframe,
		});
	}

	if (!isNil(flowLogsTimeframe)) {
		tasks.push({
			collection: 'directus_activity',
			where: ['directus_activity.action', '=', Action.RUN],
			timeframe: flowLogsTimeframe,
		});
	}

	// revisions are deleted along with their activity, only required if they expire sooner
	if (!isNil(revisionsTimeframe) && (isNil(activityTimeframe) || activityTimeframe > revisionsTimeframe)) {
		tasks.push({
			collection: 'directus_revisions',
			join: ['directus_activity', 'directus_revisions.activity', 'directus_activity.id'],
			timeframe: revisionsTimeframe,
		});
	}

	if (tasks.length === 0) {
		logger.warn('No retention timeframes are set. Retention disabled.');
		return false;
	}

	// -1 as the parent-nulling update binds `null` in addition to the ids, so a batch can use all but one of the bindings
	const maxBatch = getHelpers(getDatabase()).capabilities.getMaxBindings() - 1;

	if (batch > maxBatch) {
		logger.warn(
			`"RETENTION_BATCH" value ${batch} exceeds the database limit. Using the maximum allowed value of ${maxBatch}`,
		);

		batch = maxBatch;
	}

	scheduleSynchronizedJob('retention', cron, async () => {
		try {
			await runExclusive('retention', () => handleRetentionJob(tasks, batch), {
				// no timeout, the run is resumable and the lock lease prevents overlapping runs while it continues
				timeout: Infinity,
			});
		} catch (error) {
			logger.error(error, 'Retention run failed');
		}
	});

	return true;
}
