import { LOG_LEVELS } from '@directus/constants';

export function isValidLogLevel(level: string): level is keyof typeof LOG_LEVELS {
	return level in LOG_LEVELS;
}
