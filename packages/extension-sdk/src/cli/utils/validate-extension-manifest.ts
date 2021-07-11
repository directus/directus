import { EXTENSION_PKG_KEY } from '@directus/shared/constants';
import { ExtensionManifest } from '@directus/shared/types';

export default function validateExtensionManifest(extensionManifest: ExtensionManifest): boolean {
	const extensionOptions = extensionManifest[EXTENSION_PKG_KEY];

	if (extensionOptions === undefined) {
		return false;
	}

	if (
		extensionOptions.type === undefined ||
		extensionOptions.path === undefined ||
		extensionOptions.source === undefined ||
		extensionOptions.host === undefined ||
		extensionOptions.hidden === undefined
	) {
		return false;
	}

	return true;
}
