import { LOG_LEVELS } from '@directus/constants';

export const getAllowedLogLevels = (level: string) => {
	const levelValue = LOG_LEVELS[level as keyof typeof LOG_LEVELS];

	if (levelValue === undefined) {
		throw new Error(`Invalid log level: ${level}`);
	}

	return Object.keys(LOG_LEVELS).filter((logLevel) => LOG_LEVELS[logLevel as keyof typeof LOG_LEVELS] >= levelValue);
};
