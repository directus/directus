import { createHash } from 'node:crypto';
import { hostname } from 'node:os';

export const _cache: { id: string | undefined } = { id: undefined };

/**
 * Return a unique hash for the current process on the current machine. Will be different after a
 * restart
 */
export const processId = () => {
	if (_cache.id) return _cache.id;

	const parts = [hostname(), process.pid, new Date().getTime()];
	const hash = createHash('md5').update(parts.join(''));

	_cache.id = hash.digest('hex');

	return _cache.id;
};
