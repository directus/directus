import type { RestCommand } from '../../types.js';

/**
 * Request a password reset email to be sent to the given user.
 *
 * @param email Email address of the user you're requesting a password reset for.
 * @param reset_url Provide a custom reset url which the link in the email will lead to. The reset token will be passed as a parameter.
 *
 * @returns Empty body.
 */
export const passwordRequest =
	<Schema>(email: string, reset_url?: string): RestCommand<void, Schema> =>
	() => ({
		path: '/auth/password/request',
		method: 'POST',
		body: JSON.stringify({ email, ...(reset_url ? { reset_url } : {}) }),
	});
