import { useEnv } from '@directus/env';
import { toBoolean } from '@directus/utils';
import { scheduleJob } from 'node-schedule';
import { promisify } from 'node:util';
import pm2 from 'pm2';
import { useMetrics } from '../metrics/index.js';
import { validateCron } from '../utils/schedule.js';

const METRICS_LOCK_TIMEOUT = 10 * 60 * 1000; // 10 mins
const isPM2 = 'PM2_HOME' in process.env;
const METRICS_SYNC_PACKET = 'directus:metrics---data-sync';

const listApps = promisify(pm2.list.bind(pm2));
const sendDataToProcessId = promisify(pm2.sendDataToProcessId.bind(pm2));

const metrics = useMetrics();
let lockedAt = 0;

export async function handleMetricsJob() {
	const now = Date.now();

	if (lockedAt !== 0 && lockedAt > now - METRICS_LOCK_TIMEOUT) {
		// ensure only generating metrics once per node
		return;
	}

	lockedAt = Date.now();

	await metrics.generate();

	if (isPM2) {
		try {
			// sync
			const apps = await listApps();

			const data = await metrics.asJSON();

			const syncs = [];

			for (const app of apps) {
				if (app.pm_id === undefined || app.pid === 0 || app.name !== 'directus' || app.pid === process.pid) {
					continue;
				}

				syncs.push(
					sendDataToProcessId(app.pm_id, {
						data,
						topic: METRICS_SYNC_PACKET,
					}),
				);
			}

			await Promise.allSettled(syncs);
		} catch {
			// ignore
		}
	}

	lockedAt = 0;
}

/**
 * Schedule the metric generation
 *
 * @returns Whether or not metrics has been initialized
 */
export default async function schedule(): Promise<boolean> {
	const env = useEnv();

	if (!toBoolean(env['METRICS_ENABLED'])) {
		return false;
	}

	if (!validateCron(String(env['METRICS_SCHEDULE']))) {
		return false;
	}

	scheduleJob('metrics', String(env['METRICS_SCHEDULE']), handleMetricsJob);

	if (isPM2) {
		// listen for data from pm2 workers
		process.on('message', (packet: any) => {
			if (!packet.data || packet.topic !== METRICS_SYNC_PACKET) return;

			metrics.aggregate(packet.data);
		});
	}

	return true;
}
