import { createHash } from 'node:crypto';

const SECONDS_PER_HOUR = 3600;
const ALLOWED_HOURS = [12, 8, 6, 4, 3, 2, 1];

/**
 * Convert seconds to a cron, rounded down to 1, 2, 3, 4, 6, 8 or 12 hours.
 *
 * The seed picks the minute, second and offset. It must be stable across instances because
 * scheduleSynchronizedJob keys its clock on the cron string and dedupes on the next fire time,
 * so only identical crons collapse into a single run. A random value per instance would give
 * each its own clock and every instance would run the check.
 */
export function durationToCron(duration: number, seed: string): string {
	const [second, minute, phase] = createHash('sha256').update(seed).digest();

	const hours = ALLOWED_HOURS.find((hours) => hours * SECONDS_PER_HOUR <= duration) ?? 1;

	return `${second! % 60} ${minute! % 60} ${phase! % hours}/${hours} * * *`;
}
