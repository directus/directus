import { useEnv } from '@directus/env';
import { nanoid } from 'nanoid';

export const _cache: { secret: string | null } = { secret: null };

export const getSecret = () => {
	if (_cache.secret) {
		return _cache.secret;
	}

	const env = useEnv();

	if (env['SECRET']) {
		return env['SECRET'] as string;
	}

	_cache.secret = nanoid(32);

	return _cache.secret;
};
