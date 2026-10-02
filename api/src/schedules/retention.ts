import { Action } from '@directus/constants';
import { useEnv } from '@directus/env';
import { toBoolean } from '@directus/utils';
import type { Knex } from 'knex';
import { chunk } from 'lodash-es';
import { getHelpers } from '../database/helpers/index.js';
import getDatabase from '../database/index.js';
import { useLock } from '../lock/index.js';
import { useLogger } from '../logger/index.js';
import { getMilliseconds } from '../utils/get-milliseconds.js';
import { scheduleSynchronizedJob, validateCron } from '../utils/schedule.js';

export interface RetentionTask {
	collection: string;
	where?: readonly [string, string, Knex.Value | null];
	join?: readonly [string, string, string];
	timeframe: number | undefined;
}

const env = useEnv();

const retentionLockKey = 'schedule--data-retention';
const retentionLockTimeout = 10 * 60 * 1000; // 10 mins

// Some databases cap how many values a single `whereIn` can hold. Chunk per-dialect instead of
// relying on each database's own (much larger) default limit.
const DEFAULT_IN_CLAUSE_CHUNK_SIZE = 10_000;
const ORACLE_IN_CLAUSE_CHUNK_SIZE = 1_000;
const MSSQL_IN_CLAUSE_CHUNK_SIZE = 2_000;

const ACTIVITY_RETENTION_TIMEFRAME = getMilliseconds(env['ACTIVITY_RETENTION']);
const FLOW_LOGS_RETENTION_TIMEFRAME = getMilliseconds(env['FLOW_LOGS_RETENTION']);
const REVISIONS_RETENTION_TIMEFRAME = getMilliseconds(env['REVISIONS_RETENTION']);

const retentionTasks: RetentionTask[] = [
	{
		collection: 'directus_activity',
		where: ['action', '!=', Action.RUN],
		timeframe: ACTIVITY_RETENTION_TIMEFRAME,
	},
	{
		collection: 'directus_activity',
		where: ['action', '=', Action.RUN],
		timeframe: FLOW_LOGS_RETENTION_TIMEFRAME,
	},
];

export async function handleRetentionJob() {
	const database = getDatabase();
	const logger = useLogger();
	const lock = useLock();
	const batch = Number(env['RETENTION_BATCH']);
	const lockTime = await lock.get(retentionLockKey);
	const now = Date.now();
	const helpers = getHelpers(database);

	let inClauseChunkSize = DEFAULT_IN_CLAUSE_CHUNK_SIZE;

	if (helpers.schema.isOneOfClients(['oracle'])) {
		inClauseChunkSize = ORACLE_IN_CLAUSE_CHUNK_SIZE;
	} else if (helpers.schema.isOneOfClients(['mssql'])) {
		inClauseChunkSize = MSSQL_IN_CLAUSE_CHUNK_SIZE;
	}

	if (lockTime && Number(lockTime) > now - retentionLockTimeout) {
		// ensure only one connected process
		return;
	}

	await lock.set(retentionLockKey, Date.now());

	for (const task of retentionTasks) {
		let count = 0;

		if (task.timeframe === undefined) {
			// skip disabled tasks
			continue;
		}

		do {
			const subquery = database
				.queryBuilder()
				.select(`${task.collection}.id`)
				.from(task.collection)
				.where('timestamp', '<', helpers.date.parse(new Date(Date.now() - task.timeframe)))
				.limit(batch);

			if (task.where) {
				subquery.where(...task.where);
			}

			if (task.join) {
				subquery.join(...task.join);
			}

			try {
				// mysql/maria does not allow limit within a subquery, and the ids are needed to clear revision parents
				// https://dev.mysql.com/doc/refman/8.4/en/subquery-restrictions.html
				const records = await subquery.then((r) => r.map((r) => r.id));

				if (records.length === 0) {
					break;
				}

				count = await database.transaction(async (trx) => {
					let revisionIds = records;

					if (task.collection === 'directus_activity') {
						revisionIds = [];

						for (const idsChunk of chunk(records, inClauseChunkSize)) {
							const revisions = await trx('directus_revisions').select('id').whereIn('activity', idsChunk);
							revisionIds.push(...revisions.map((revision) => revision.id));
						}
					}

					// parent has no cascade, so references to deleted revisions must be cleared first
					for (const idsChunk of chunk(revisionIds, inClauseChunkSize)) {
						await trx('directus_revisions').update({ parent: null }).whereIn('parent', idsChunk);
					}

					let deleted = 0;

					for (const idsChunk of chunk(records, inClauseChunkSize)) {
						deleted += await trx(task.collection).whereIn('id', idsChunk).delete();
					}

					return deleted;
				});
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
 * @returns Whether or not retention has been initialized
 */
export default async function schedule(): Promise<boolean> {
	const env = useEnv();

	if (!toBoolean(env['RETENTION_ENABLED'])) {
		return false;
	}

	if (!validateCron(String(env['RETENTION_SCHEDULE']))) {
		return false;
	}

	if (
		!ACTIVITY_RETENTION_TIMEFRAME ||
		(ACTIVITY_RETENTION_TIMEFRAME &&
			REVISIONS_RETENTION_TIMEFRAME &&
			ACTIVITY_RETENTION_TIMEFRAME > REVISIONS_RETENTION_TIMEFRAME)
	) {
		retentionTasks.push({
			collection: 'directus_revisions',
			join: ['directus_activity', 'directus_revisions.activity', 'directus_activity.id'],
			timeframe: REVISIONS_RETENTION_TIMEFRAME,
		});
	}

	scheduleSynchronizedJob('retention', String(env['RETENTION_SCHEDULE']), handleRetentionJob);

	return true;
}
