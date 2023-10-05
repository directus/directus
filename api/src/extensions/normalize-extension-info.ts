import type { Extension, ExtensionInfo, BundleExtension, NestedExtensionType } from '@directus/types';

/**
 * Creates a standardized extension info object for a given extension
 */
export const normalizeExtensionInfo = (extension: Extension): ExtensionInfo => {
	const extensionInfo: ExtensionInfo = {
		name: extension.name,
		type: extension.type,
		local: extension.local,
		entries: [],
	};

	if (extension.host) extensionInfo.host = extension.host;
	if (extension.version) extensionInfo.version = extension.version;

	if (extension.type === 'bundle') {
		const bundleExtensionInfo: Omit<BundleExtension, 'entrypoint' | 'path'> = {
			name: extensionInfo.name,
			type: 'bundle',
			local: extensionInfo.local,
			entries: extension.entries.map((entry) => ({
				name: entry.name,
				type: entry.type,
			})) as { name: ExtensionInfo['name']; type: NestedExtensionType }[],
		};

		return bundleExtensionInfo;
	} else {
		return extensionInfo;
	}
}
