import cron from 'cron-parser';
import schedule from 'node-schedule';
import { SynchronizedClock } from '../synchronization.js';

export interface ScheduledJob {
	stop(): Promise<void>;
}

export function validateCron(rule: string): boolean {
	try {
		cron.parseExpression(rule);
	} catch {
		return false;
	}

	return true;
}

export function scheduleSynchronizedJob(
	id: string,
	rule: string,
	cb: (fireDate: Date) => void | Promise<void>
): ScheduledJob {
	const clock = new SynchronizedClock(`${id}:${rule}`);

	const job = schedule.scheduleJob(rule, async (fireDate) => {
		const nextTimestamp = job.nextInvocation().getTime();

		const wasSet = await clock.set(nextTimestamp);

		if (wasSet) {
			await cb(fireDate);
		}
	});

	const stop = async () => {
		job.cancel();

		await clock.reset();
	};

	return { stop };
}
