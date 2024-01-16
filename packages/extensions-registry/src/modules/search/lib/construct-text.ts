import type { SearchOptions } from '../types/search-options.js';

export const constructText = (options: Pick<SearchOptions, 'text' | 'extensionType' | 'author' | 'maintainer'>) => {
	let text = options?.text ?? '';

	if (options?.extensionType) {
		text += ` keywords:"directus-extension-${options.extensionType}"`;
	} else {
		text += ' keywords:"directus-extension"';
	}

	if (options?.author) {
		text += ` author:${options.author}`;
	}

	if (options?.maintainer) {
		text += ` maintainer:${options.maintainer}`;
	}

	return text.trim();
};
