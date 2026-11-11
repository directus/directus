import { InvalidPayloadError } from '@directus/errors';
import { isKnownIcon } from '@directus/utils';

/**
 * The app renders an icon name it doesn't know as plain text, so only accept names it can draw.
 * `undefined` (not being set), `null` and `""` (no icon) are allowed.
 */
export function assertKnownIcon(icon: unknown, field = 'icon'): void {
	if (icon === undefined || icon === null || icon === '') return;
	if (typeof icon === 'string' && isKnownIcon(icon)) return;

	throw new InvalidPayloadError({ reason: `"${field}" has to be a known icon name` });
}
