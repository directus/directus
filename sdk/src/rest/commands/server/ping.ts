import type { RestCommand } from '../../types.js';

/**
 * Ping... pong! 🏓
 * @returns Pong
 */
export const serverPing =
	<Schema extends object>(): RestCommand<string, Schema> =>
	() => ({
		method: 'GET',
		path: '/server/ping',
	});
