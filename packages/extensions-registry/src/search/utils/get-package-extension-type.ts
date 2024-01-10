import type { ExtensionType } from '@directus/extensions';
import { EXTENSION_TYPES } from '@directus/extensions';
import { isIn } from '@directus/utils';
import type { RegistrySearchResponsePackage } from '../schemas/registry-search-response.js';

export const getPackageExtensionType = (
	keywords: RegistrySearchResponsePackage['package']['keywords'],
): ExtensionType | null => {
	let type: string | null = null;

	/*
	 * @TODO We want to support directus-custom-x as the keyword for extensions built against earlier
	 * versions of the SDK, but these should be phased out over time
	 */
	const keywordPrefixes = ['directus-extension-', 'directus-custom-'];

	keywords.forEach((keyword) => {
		keywordPrefixes.forEach((prefix) => {
			if (keyword.startsWith(prefix)) {
				type = keyword.substring(prefix.length);
			}
		});
	});

	return type && isIn(type, EXTENSION_TYPES) ? type : null;
};
