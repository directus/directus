import type { DirectusExtension, ExtensionTypes } from '../../../schema/extension.js';
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

export type DirectusExtensionRegistryAccount = {
	id: string;
	username: string;
	verified: boolean;
	github_username: string | null;
	github_avatar_url: string | null;
	github_name: string | null;
	github_company: string | null;
	github_blog: string | null;
	github_location: string | null;
	github_bio: string | null;
};

export type DirectusExtensionRegistryVersionPublisher = {
	id: string;
	username: string;
	verified: boolean;
	github_name: string | null;
	github_avatar_url: string | null;
};

export type DirectusExtensionRegistryVersion = {
	id: string;
	version: string;
	verified: boolean;
	type: ExtensionTypes;
	host_version: string;
	publish_date: string;
	unpacked_size: number;
	file_count: number;
	url_bugs: string | null;
	url_homepage: string | null;
	url_repository: string | null;
	license: string | null;
	publisher: DirectusExtensionRegistryVersionPublisher;
	bundled: { name: string; type: string }[];
	maintainers: { accounts_id: DirectusExtensionRegistryVersionPublisher }[] | null;
};

export type DirectusExtensionRegistryDetail = {
	id: string;
	name: string;
	description: string | null;
	total_downloads: number;
	downloads: { date: string; count: number }[] | null;
	verified: boolean;
	readme: string | null;
	type: ExtensionTypes;
	license: string | null;
	versions: DirectusExtensionRegistryVersion[];
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
	<Schema>(pk: string): RestCommand<DirectusExtensionRegistryAccount, Schema> =>
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
	<Schema>(pk: string): RestCommand<DirectusExtensionRegistryDetail, Schema> =>
	() => {
		throwIfEmpty(pk, 'Extension key cannot be empty');

		return {
			path: `/extensions/registry/extension/${pk}`,
			method: 'GET',
		};
	};
