import {
	EXTENSION_PACKAGE_TYPES,
	EXTENSION_PKG_KEY,
	EXTENSION_TYPES,
	HYBRID_EXTENSION_TYPES,
	PACKAGE_EXTENSION_TYPES,
} from '../constants';
import {
	ExtensionManifest,
	ExtensionManifestRaw,
	ExtensionOptionsBundleEntry,
	ExtensionOptionsBundleEntryRaw,
} from '../types';
import { isIn } from './array-helpers';

export function validateExtensionManifest(
	extensionManifest: ExtensionManifestRaw
): extensionManifest is ExtensionManifest {
	if (!extensionManifest.name || !extensionManifest.version) {
		return false;
	}

	const extensionOptions = extensionManifest[EXTENSION_PKG_KEY];

	if (
		!extensionOptions ||
		!extensionOptions.type ||
		!isIn(extensionOptions.type, EXTENSION_PACKAGE_TYPES) ||
		!extensionOptions.host
	) {
		return false;
	}

	if (isIn(extensionOptions.type, PACKAGE_EXTENSION_TYPES)) {
		if (extensionOptions.type === 'bundle') {
			if (
				!extensionOptions.path ||
				typeof extensionOptions.path === 'string' ||
				!extensionOptions.path.app ||
				!extensionOptions.path.api ||
				!extensionOptions.entries ||
				!Array.isArray(extensionOptions.entries) ||
				!extensionOptions.entries.every((entry) => validateExtensionOptionsBundleEntry(entry))
			) {
				return false;
			}
		}
	} else {
		if (isIn(extensionOptions.type, HYBRID_EXTENSION_TYPES)) {
			if (
				!extensionOptions.path ||
				!extensionOptions.source ||
				typeof extensionOptions.path === 'string' ||
				typeof extensionOptions.source === 'string' ||
				!extensionOptions.path.app ||
				!extensionOptions.path.api ||
				!extensionOptions.source.app ||
				!extensionOptions.source.api
			) {
				return false;
			}
		} else {
			if (!extensionOptions.path || !extensionOptions.source) {
				return false;
			}
		}
	}

	return true;
}

export function validateExtensionOptionsBundleEntry(
	entry: ExtensionOptionsBundleEntryRaw
): entry is ExtensionOptionsBundleEntry {
	if (!entry.type || !isIn(entry.type, EXTENSION_TYPES) || !entry.name) {
		return false;
	}

	if (isIn(entry.type, HYBRID_EXTENSION_TYPES)) {
		if (!entry.source || typeof entry.source === 'string' || !entry.source.app || !entry.source.api) {
			return false;
		}
	} else {
		if (!entry.source) {
			return false;
		}
	}

	return true;
}
