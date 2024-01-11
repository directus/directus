import type { ExtensionType } from '@directus/extensions';

export interface SearchOptions {
	/**
	 * What extension type to search for
	 */
	extensionType?: ExtensionType;

	/**
	 * Search for extensions authored by a given user
	 */
	author?: string;

	/**
	 * Search for extensions that are maintained by a given user
	 */
	maintainer?: string;

	/**
	 * Number of items per page. Has to be between 1 and 250
	 * @default 20
	 */
	limit?: number;

	/**
	 * Where to start in the search results
	 */
	offset?: number;

	/**
	 * NPM registry search text. Supports npm "special search qualifiers"
	 * @see https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md
	 */
	text?: string;

	/**
	 * What registry to search through. Has to support the NPM registry search API
	 * @default "https://registry.npmjs.org"
	 */
	registry?: string;
}
