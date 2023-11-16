import type { RestCommand } from '../../types.js';

export type ServerHealthOutput = {
	status: 'ok' | 'warn' | 'error';
	releaseId?: string;
	serviceId?: string;
	checks?: {
		[name: string]: Record<string, any>[];
	};
};

/**
 * Get the current health status of the server.
 * @returns The current health status of the server.
 */
export const serverHealth =
	<Schema extends object>(): RestCommand<ServerHealthOutput, Schema> =>
	() => ({
		method: 'GET',
		path: '/server/health',
	});
