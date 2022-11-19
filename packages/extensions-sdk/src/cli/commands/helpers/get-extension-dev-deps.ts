import { API_OR_HYBRID_EXTENSION_TYPES, APP_OR_HYBRID_EXTENSION_TYPES } from '@directus/shared/constants';
import { ExtensionPackageType } from '@directus/shared/types';
import { isIn } from '@directus/shared/utils';
import { Language } from '../../types';
import getPackageVersion from '../../utils/get-package-version';
import getSdkVersion from '../../utils/get-sdk-version';

export default async function getExtensionDevDeps(
	type: ExtensionPackageType | ExtensionPackageType[],
	language: Language | Language[] = []
): Promise<Record<string, string>> {
	const types = Array.isArray(type) ? type : [type];
	const languages = Array.isArray(language) ? language : [language];

	const deps: Record<string, string> = {
		'@directus/extensions-sdk': getSdkVersion(),
	};

	if (languages.includes('typescript')) {
		if (types.some((type) => isIn(type, API_OR_HYBRID_EXTENSION_TYPES))) {
			deps['@types/node'] = `^${await getPackageVersion('@types/node')}`;
		}

		deps['typescript'] = `^${await getPackageVersion('typescript')}`;
	}

	if (types.some((type) => isIn(type, APP_OR_HYBRID_EXTENSION_TYPES))) {
		deps['vue'] = `^${await getPackageVersion('vue')}`;
	}

	return deps;
}
