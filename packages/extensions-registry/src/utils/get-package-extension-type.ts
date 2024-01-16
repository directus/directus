import type { ExtensionType } from '@directus/extensions';
import { EXTENSION_TYPES } from '@directus/extensions';
import { isIn } from '@directus/utils';

export const getPackageExtensionType = (keywords: string[]): ExtensionType | null => {
	let type: string | null = null;

	const keywordPrefix = 'directus-extension-';

	keywords.forEach((keyword) => {
		if (keyword.startsWith(keywordPrefix)) {
			type = keyword.substring(keywordPrefix.length);
		}
	});

	return type && isIn(type, EXTENSION_TYPES) ? type : null;
};
