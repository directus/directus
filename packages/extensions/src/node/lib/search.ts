import type { ExtensionType } from '../../shared/types/extension-types.js';
import { validateSearchText } from '../utils/validate-search-text.js';

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

export const search = async (options?: SearchOptions) => {
	if (options?.limit && (options.limit <= 0 || options.limit >= 250)) {
		throw new TypeError('"limit" must be in range 1...250');
	}

	if (options?.text) {
		validateSearchText(options.text);
	}

	let text = options?.text ?? '';

	if (options?.extensionType) {
		/*
		 * In versions < 10.8, the default tag was called directus-custom-x instead of
		 * directus-extension-x. To allow those older extensions to still be found, we'll search for
		 * both for the time being.
		 *
		 * @TODO remove `directus-custom-x` tag search
		 */
		text += ` keywords:directus-extension-${options.extensionType},directus-custom-${options.extensionType}`;
	}

	if (options?.author) {
		text += ` author:${options.author}`;
	}

	if (options?.maintainer) {
		text += ` maintainer:${options.maintainer}`;
	}

	const url = new URL('/-/v1/search', options?.registry ?? 'https://registry.npmjs.org');

	url.searchParams.set('text', text);

	if (options?.limit !== undefined) {
		url.searchParams.set('size', String(options.limit));
	}

	if (options?.offset !== undefined) {
		url.searchParams.set('from', String(options.offset));
	}

	const response = await fetch(url);

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`Couldn't search extensions: [${response.status}] ${response.statusText}\n\n${body}`);
	}

	const pkgs = await response.json();

	return pkgs;
};
