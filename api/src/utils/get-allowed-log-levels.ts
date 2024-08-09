import { useLogger } from '../logger/index.js';

const logger = useLogger();

export const getAllowedLogLevels = (level: string) => {
	const levelValue = logger.levels.values[level];

	if (levelValue === undefined) {
		throw new Error(`Invalid "${level}" log level`);
	}

	return Object.fromEntries(
		Object.entries(logger.levels.values)
			.filter(([_, value]) => value >= levelValue)
			.sort((a, b) => a[1] - b[1]),
	);
};
