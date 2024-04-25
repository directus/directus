import { useEnv } from '@directus/env';
import { randomUUID } from 'crypto';
import { useLogger } from '../logger.js';

export const _cache: { secret: string | null } = { secret: null };

export const getSecret = () => {
	if (_cache.secret) {
		return _cache.secret;
	}

	const env = useEnv();
	const logger = useLogger();

	if (env['SECRET']) {
		return env['SECRET'] as string;
	}

	logger.warn(
		`"SECRET" env variable is missing. Using a random value instead. Tokens will not persist between restarts. This is not appropriate for production usage.`,
	);

	_cache.secret = randomUUID();

	return _cache.secret;
};
