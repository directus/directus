import type { RestCommand } from '../../types.js';

/**
 * Request the current OAuth user to setup 2fa
 *
 * @returns Empty 204 response on success
 */
export const requestTfaSetup =
	<Schema>(): RestCommand<void, Schema> =>
	() => ({
		path: '/users/me/tfa/request-setup',
		method: 'POST',
		body: '{}',
	});

/**
 * Cancels the current OAuth user 2fa setup
 *
 * @returns Empty 204 response on success
 */
export const cancelTfaSetup =
	<Schema>(): RestCommand<void, Schema> =>
	() => ({
		path: '/users/me/tfa/cancel-setup',
		method: 'POST',
		body: '{}',
	});
