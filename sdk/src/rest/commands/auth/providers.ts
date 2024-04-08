import type { RestCommand } from '../../types.js';

export type ReadProviderOutput = {
	data: {
		name: string;
		driver: string;
		icon?: string | null;
	}[];
	disableDefault: boolean;
};

/**
 * List all the configured auth providers.
 *
 * @returns Array of configured auth providers.
 */
export const readProviders =
	<Schema extends object>(sessionOnly = false): RestCommand<ReadProviderOutput, Schema> =>
	() => ({
		path: sessionOnly ? '/auth?sessionOnly' : '/auth',
		method: 'GET',
		extractData: false,
	});
