import type { Knex } from 'knex';
import env from './env.js';
import logger from './logger.js';
import { validateCron, type ScheduledJob, scheduleSynchronizedJob } from './utils/schedule.js';
import { Action } from '@directus/constants';
import { adjustDate } from '@directus/utils';
import getDatabase from './database/index.js';
import { getMessenger } from './messenger.js';
import { JobQueue } from './utils/job-queue.js';

type RetentionJobs = Record<string, (database: Knex, oldestRetentionDate: Date) => Promise<void>>;

let retentionManager: RetentionManager | undefined;

export function getRetentionManager(): RetentionManager {
	if (retentionManager) {
		return retentionManager;
	}

	retentionManager = new RetentionManager();

	return retentionManager;
}

const RETENTION_CRON = env['RETENTION_CRON'] ?? '0 0 * * *';

class RetentionManager {
	private isLoaded = false;
	private scheduledJobs: Set<ScheduledJob> = new Set();
	private reloadQueue: JobQueue;

	constructor() {
		this.reloadQueue = new JobQueue();

		const messenger = getMessenger();

		messenger.subscribe('retentions', (event) => {
			if (event['type'] === 'reload') {
				this.reloadQueue.enqueue(async () => {
					if (this.isLoaded) {
						await this.unload();
						await this.load();
					} else {
						logger.warn('Retentions have to be loaded before they can be reloaded');
					}
				});
			}
		});
	}

	public async initialize() {
		if (!this.isLoaded) {
			if (!validateCron(RETENTION_CRON)) {
				logger.error(`Couldn't initialize retention manager. Provided cron is invalid: ${RETENTION_CRON}`);
				return;
			}

			await this.load();
		}
	}

	public async reload(): Promise<void> {
		const messenger = getMessenger();

		messenger.publish('retentions', { type: 'reload' });
	}

	public async load() {
		const retentionJobs: RetentionJobs = {
			// revisions job is intentionally ran before activity
			revisions: async (database, oldestRetentionDate) => {
				const oldestActivity = await database
					.select('id')
					.from('directus_activity')
					.where('timestamp', '<=', oldestRetentionDate)
					.first();

				if (!oldestActivity) return;

				await database('directus_revisions').where('activity', '<=', oldestActivity.id).del();
			},
			activity: async (database, oldestRetentionDate) => {
				await database('directus_activity')
					.where('timestamp', '<=', oldestRetentionDate)
					.andWhere('action', '!=', Action.COMMENT)
					.andWhere('action', '!=', Action.VERSION_SAVE)
					.del();
			},
			notifications: async (database, oldestRetentionDate) => {
				await database('directus_notifications')
					.where('timestamp', '<=', oldestRetentionDate)
					.andWhere('status', '=', 'archived')
					.del();
			},
		};

		const database = getDatabase();

		for (const [jobName, truncateFunction] of Object.entries(retentionJobs)) {
			const key = `RETENTION_${jobName.toUpperCase()}`;

			if (!env[key] || env[key] === 'infinite') continue;
			const oldestRetentionDate = adjustDate(new Date(), '-' + env[key]);

			if (!oldestRetentionDate) {
				logger.error(`Invalid ${key} configured`);
				continue;
			}

			const job = scheduleSynchronizedJob(`retention:${jobName}`, RETENTION_CRON, async () => {
				await truncateFunction(database, oldestRetentionDate);
			});

			this.scheduledJobs.add(job);
		}

		this.isLoaded = true;
	}

	public async unload() {
		for (const job of this.scheduledJobs) {
			await job.stop();
		}

		this.scheduledJobs.clear();

		this.isLoaded = false;
	}
}
