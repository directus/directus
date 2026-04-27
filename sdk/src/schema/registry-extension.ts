import type { ExtensionTypes } from './extension.js';

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

export type DirectusExtensionRegistryListMeta = {
	filter_count: number;
};

export type DirectusExtensionRegistryList = {
	meta: DirectusExtensionRegistryListMeta;
	data: DirectusExtensionRegistry[];
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
