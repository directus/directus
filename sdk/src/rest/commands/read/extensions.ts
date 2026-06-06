import type { DirectusExtension } from '../../../schema/extension.js';
import type { ExtensionTypes } from '../../../schema/extension.js';
import type { RestCommand } from '../../types.js';
import { throwIfEmpty } from '../../utils/index.js';

export type DirectusExtensionRegistryPublisher = {
	username: string;
	verified: boolean;
	github_name: string | null;
};

export type DirectusExtensionRegistry = {
	id: string;
	name: string;
	description: string | null;
	total_downloads: number;
	verified: boolean;
	type: ExtensionTypes;
	last_updated: string;
	host_version: string;
	sandbox: boolean;
	license: string | null;
	publisher: DirectusExtensionRegistryPublisher;
};

export type DirectusExtensionRegistryQuery = {
	search?: string;
	limit?: number;
	offset?: number;
	sort?: 'popular' | 'recent' | 'downloads';
	filter?: {
		by?: { _eq: string };
		type?: { _eq: ExtensionTypes };
	};
};

/**
 * List the available extensions in the project.
 * @returns An array of extensions.
 */
export const readExtensions =
	<Schema>(): RestCommand<DirectusExtension<Schema>[], Schema> =>
	() => ({
		path: `/extensions/`,
		method: 'GET',
	});

/**
 * List extensions available in the registry.
 * @param query - Optional query parameters (search, limit, offset, sort, filter)
 * @returns Array of registry extensions.
 */
export const readRegistryExtensions =
	<Schema>(query?: DirectusExtensionRegistryQuery): RestCommand<DirectusExtensionRegistry[], Schema> =>
	() => ({
		path: `/extensions/registry`,
		params: query ?? {},
		method: 'GET',
	});

/**
 * Fetch a publisher account from the registry.
 * @param pk - Publisher account UUID
 * @returns The publisher account.
 * @throws Will throw if pk is empty
 */
export const readRegistryAccount =
	<Schema>(pk: string): RestCommand<DirectusExtensionRegistryPublisher, Schema> =>
	() => {
		throwIfEmpty(pk, 'Publisher key cannot be empty');

		return {
			path: `/extensions/registry/account/${pk}`,
			method: 'GET',
		};
	};

/**
 * Read a single extension from the registry.
 * @param pk - Registry extension UUID
 * @returns The registry extension.
 * @throws Will throw if pk is empty
 */
export const readRegistryExtension =
	<Schema>(pk: string): RestCommand<DirectusExtensionRegistry, Schema> =>
	() => {
		throwIfEmpty(pk, 'Extension key cannot be empty');

		return {
			path: `/extensions/registry/extension/${pk}`,
			method: 'GET',
		};
	};
