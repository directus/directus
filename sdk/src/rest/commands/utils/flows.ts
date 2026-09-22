import type { RestCommand } from '../../types.js';
import { throwIfEmpty } from '../../utils/index.js';

// TODO better options for output typing

/**
 * Trigger a flow
 * @param method
 * @param id
 * @param data
 * @returns Result of the flow, if any.
 * @throws Will throw if id is empty
 */
export const triggerFlow =
	<Schema>(method: 'GET' | 'POST', id: string, data?: Record<string, string>): RestCommand<unknown, Schema> =>
	() => {
		throwIfEmpty(id, 'ID cannot be empty');

		if (method === 'GET') {
			return {
				path: `/flows/trigger/${id}`,
				params: data ?? {},
				method: 'GET',
			};
		}

		return {
			path: `/flows/trigger/${id}`,
			body: JSON.stringify(data ?? {}),
			method: 'POST',
		};
	};
