import type { SearchOptions } from '../types/search-options.js';

export const constructText = (options: Pick<SearchOptions, 'text' | 'extensionType' | 'author' | 'maintainer'>) => {
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

	return text;
};
