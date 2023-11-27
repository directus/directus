import type { RestCommand } from '../../types.js';

/**
 * Shares work by publicly giving you an access/refresh token combination (as you would get with the regular /auth/login endpoints). These tokens are limited to a permissions set that only allows access to the item that was shared, and any relationally linked items that that associated role has access to. This means that all regular endpoints can be used with the credentials set returned by this endpoint.
 *
 * @param share Shares work by publicly giving you an access/refresh token combination (as you would get with the regular /auth/login endpoints). These tokens are limited to a permissions set that only allows access to the item that was shared, and any relationally linked items that that associated role has access to. This means that all regular endpoints can be used with the credentials set returned by this endpoint.
 * @param password Password for the share, if one is configured.
 *
 * @returns Authentication Credentials
 */
export const authenticateShare =
	<Schema extends object>(
		share: string,
		password: string,
	): RestCommand<
		{
			access_token: string;
			refresh_token: string;
			expires: number;
		},
		Schema
	> =>
	() => ({
		path: `/shares/auth`,
		method: 'POST',
		body: JSON.stringify({ share, password }),
	});

/**
 * Sends an email to the provided email addresses with a link to the share.
 *
 * @param share Primary key of the share you're inviting people to.
 * @param emails Array of email strings to send the share link to.
 *
 * @returns Nothing
 */
export const inviteShare =
	<Schema extends object>(share: string, emails: string[]): RestCommand<void, Schema> =>
	() => ({
		path: `/shares/invite`,
		method: 'POST',
		body: JSON.stringify({ share, emails }),
	});

/**
 * Allows unauthenticated users to retrieve information about the share.
 *
 * @param id Primary key of the share you're viewing.
 *
 * @returns The share objects for the given UUID, if it's still valid.
 */
export const readShareInfo =
	<Schema extends object>(
		id: string,
	): RestCommand<
		{
			id: string;
			collection: string;
			item: string;
			password: string | null;
			date_start: string | null;
			date_end: string | null;
			times_used: number | null;
			max_uses: number | null;
		},
		Schema
	> =>
	() => ({
		path: `/shares/info/${id}`,
		method: 'GET',
	});
