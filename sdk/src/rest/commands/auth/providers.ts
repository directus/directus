import type { RestCommand } from '../../types.js';

export interface ReadProviderOutput {
	name: string;
	driver: string;
	label?: string | null;
	icon?: string | null;
}

/**
 * List all the configured auth providers.
 *
 * @returns Array of configured auth providers.
 */
export const readProviders =
	<Schema>(sessionOnly = false): RestCommand<ReadProviderOutput[], Schema> =>
	() => ({
		path: sessionOnly ? '/auth?sessionOnly' : '/auth',
		method: 'GET',
	});
