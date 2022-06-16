import { EXTENSION_PKG_KEY, PACK_EXTENSION_TYPE } from '../constants';
import { ExtensionManifest, ExtensionManifestRaw } from '../types';
import { isExtensionPackage, isHybridExtension } from './is-extension';

export function validateExtensionManifest(
	extensionManifest: ExtensionManifestRaw
): extensionManifest is ExtensionManifest {
	if (!extensionManifest.name || !extensionManifest.version) {
		return false;
	}

	const extensionOptions = extensionManifest[EXTENSION_PKG_KEY];

	if (!extensionOptions) {
		return false;
	}

	if (!extensionOptions.type) {
		return false;
	}

	if (!isExtensionPackage(extensionOptions.type)) {
		return false;
	}

	if (extensionOptions.type === PACK_EXTENSION_TYPE) {
		if (!extensionOptions.host) {
			return false;
		}
	} else if (isHybridExtension(extensionOptions.type)) {
		if (
			!extensionOptions.path ||
			!extensionOptions.source ||
			typeof extensionOptions.path === 'string' ||
			typeof extensionOptions.source === 'string' ||
			!extensionOptions.path.app ||
			!extensionOptions.path.api ||
			!extensionOptions.source.app ||
			!extensionOptions.source.api ||
			!extensionOptions.host
		) {
			return false;
		}
	} else {
		if (!extensionOptions.path || !extensionOptions.source || !extensionOptions.host) {
			return false;
		}
	}

	return true;
}
