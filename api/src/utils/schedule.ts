import { CronJob, validateCronExpression } from 'cron';
import { SynchronizedClock } from '../synchronization.js';

export interface ScheduledJob {
	stop(): Promise<void>;
}

export function validateCron(rule: string): boolean {
	const validation = validateCronExpression(rule);
	return validation.valid;
}

export function scheduleSynchronizedJob(
	id: string,
	rule: string,
	cb: (fireDate: Date) => void | Promise<void>,
): ScheduledJob {
	const clock = new SynchronizedClock(`${id}:${rule}`);

	const job = new CronJob(
		rule,
		async (fireDate: Date) => {
			// Get next execution time for synchronization
			const nextDate = job.nextDate();
			const nextTimestamp = nextDate.toMillis();

			const wasSet = await clock.set(nextTimestamp);

			if (wasSet) {
				await cb(fireDate);
			}
		},
		null,
		false,
	);

	job.start();

	const stop = async () => {
		job.stop();

		await clock.reset();
	};

	return { stop };
}
