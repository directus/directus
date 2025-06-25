import type { LogoutOptions } from '../../../index.js';
import type { RestCommand } from '../../types.js';

/**
 * Invalidate the refresh token thus destroying the user's session.
 *
 * @param options Optional logout settings.
 *
 * @returns Empty body.
 */
export const logout =
	<Schema>(options: LogoutOptions = {}): RestCommand<void, Schema> =>
	() => {
		const logoutData: LogoutOptions = {
			mode: options.mode ?? 'cookie',
		};

		if (logoutData.mode === 'json' && options.refresh_token) {
			logoutData['refresh_token'] = options.refresh_token;
		}

		return {
			path: '/auth/logout',
			method: 'POST',
			body: JSON.stringify(logoutData),
		};
	};
