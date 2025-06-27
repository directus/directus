import type { AuthenticationData, RefreshOptions } from '../../../index.js';
import type { RestCommand } from '../../types.js';

/**
 * Retrieve a new access token using a refresh token.
 *
 * @param options Optional refresh settings.
 *
 * @returns The new access and refresh tokens for the session.
 */
export const refresh =
	<Schema>(options: RefreshOptions = {}): RestCommand<AuthenticationData, Schema> =>
	() => {
		const refreshData: RefreshOptions = {
			mode: options.mode ?? 'cookie',
		};

		if (refreshData.mode === 'json' && options.refresh_token) {
			refreshData['refresh_token'] = options.refresh_token;
		}

		return {
			path: '/auth/refresh',
			method: 'POST',
			body: JSON.stringify(refreshData),
		};
	};
