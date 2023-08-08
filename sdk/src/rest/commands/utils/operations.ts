import type { RestCommand } from '../../types.js';

// TODO better options for ouput typing

/**
 * Trigger an operation
 * @param id
 * @param data
 * @returns Result of the flow, if any.
 */
export const triggerOperation =
	<Schema extends object>(id: string, data?: any): RestCommand<unknown, Schema> =>
	() => ({
		path: `/operations/trigger/${id}`,
		body: JSON.stringify(data ?? {}),
		method: 'POST',
	});
