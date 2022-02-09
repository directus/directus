import { EXTENSION_PKG_KEY } from '../constants';
import { ExtensionManifest, ExtensionManifestRaw } from '../types';
import { isExtensionPackage } from './is-extension';

export function validateExtensionManifest(
	extensionManifest: ExtensionManifestRaw
): extensionManifest is ExtensionManifest {
	if (extensionManifest.name === undefined || extensionManifest.version === undefined) {
		return false;
	}

	const extensionOptions = extensionManifest[EXTENSION_PKG_KEY];

	if (extensionOptions === undefined) {
		return false;
	}

	if (extensionOptions.type === undefined) {
		return false;
	}

	if (!isExtensionPackage(extensionOptions.type)) {
		return false;
	}

	if (extensionOptions.type !== 'pack') {
		if (
			extensionOptions.path === undefined ||
			extensionOptions.source === undefined ||
			extensionOptions.host === undefined
		) {
			return false;
		}
	} else {
		if (extensionOptions.host === undefined) {
			return false;
		}
	}

	return true;
}
