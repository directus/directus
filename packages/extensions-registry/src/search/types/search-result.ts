import type { ExtensionType } from '@directus/extensions';

export interface SearchResultMeta {
	filter_count: number;
}

export interface SearchResultPackage {
	name: string;
	version: string;
	description: string;
	type: ExtensionType | null;
	author: string;
	maintainers: string[];
}

export interface SearchResult {
	meta: SearchResultMeta;
	data: SearchResultPackage[];
}
