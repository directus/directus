import { useEnv } from '@directus/env';
import { InvalidPayloadError } from '@directus/errors';
import { toArray } from '@directus/utils';

/**
 * Reject storage locations that aren't configured, as none of the path checks apply to them.
 * Location names are case-sensitive
 *
 * @throws InvalidPayloadError
 *
 */
export function assertValidStorageLocation(storage: unknown): asserts storage is string {
	const env = useEnv();
	const locations = toArray(env['STORAGE_LOCATIONS'] as string).map((location) => location.trim());

	if (typeof storage !== 'string' || locations.includes(storage) === false) {
		throw new InvalidPayloadError({ reason: `Storage location "${storage}" doesn't exist` });
	}
}
