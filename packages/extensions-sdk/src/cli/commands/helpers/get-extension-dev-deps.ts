import { API_EXTENSION_TYPES, APP_EXTENSION_TYPES, HYBRID_EXTENSION_TYPES } from '@directus/extensions';
import type { ExtensionType } from '@directus/extensions';
import { isIn } from '@directus/utils';
import type { Language } from '../../types.js';
import getPackageVersion from '../../utils/get-package-version.js';
import getSdkVersion from '../../utils/get-sdk-version.js';

type GetExtensionDevDepsOptions = {
	base?: Record<string, string> | undefined;
};

export default async function getExtensionDevDeps(
	type: ExtensionType | ExtensionType[],
	language: Language | Language[] = [],
	options?: GetExtensionDevDepsOptions,
): Promise<Record<string, string>> {
	const types = Array.isArray(type) ? type : [type];
	const languages = Array.isArray(language) ? language : [language];
	const deps = options?.base ?? {};

	deps['@directus/extensions-sdk'] = getSdkVersion();

	if (languages.includes('typescript')) {
		if (types.some((type) => isIn(type, [...API_EXTENSION_TYPES, ...HYBRID_EXTENSION_TYPES]))) {
			deps['@types/node'] = `^${await getPackageVersion('@types/node')}`;
		}

		deps['typescript'] = `^${await getPackageVersion('typescript')}`;
	}

	if (types.some((type) => isIn(type, [...APP_EXTENSION_TYPES, ...HYBRID_EXTENSION_TYPES]))) {
		deps['vue'] = `^${await getPackageVersion('vue')}`;
	}

	return deps;
}
