import type { ExtensionType } from '@directus/extensions';
import { EXTENSION_TYPES } from '@directus/extensions';
import { isIn } from '@directus/utils';

export const getPackageExtensionType = (keywords: string[]): ExtensionType | null => {
	let type: string | null = null;

	const keywordPrefix = 'directus-extension-';

	for (const keyword of keywords) {
		if (keyword.startsWith(keywordPrefix)) {
			/*
			 * If the type has already been extracted, return null to indicate we can't know the type for sure
			 */
			if (type !== null) {
				return null;
			}

			type = keyword.substring(keywordPrefix.length);
		}
	}

	return type && isIn(type, EXTENSION_TYPES) ? type : null;
};
