import type { Extension, ExtensionInfo, ExtensionSettings, NormalizedBundleExtension } from '@directus/extensions';
import { omit } from 'lodash-es';

/**
 * Creates a standardized extension info object for a given extension
 */
export const normalizeExtensionInfo = (extension: Extension, settings: ExtensionSettings[]): ExtensionInfo => {
	const extensionInfo: ExtensionInfo = {
		name: extension.name,
		type: extension.type,
		local: extension.local,
		entries: [],
		settings: omit(
			settings.find(({ name }) => extension.name === name),
			'name'
		),
	};

	if (extension.host) extensionInfo.host = extension.host;
	if (extension.version) extensionInfo.version = extension.version;

	if (extension.type === 'bundle') {
		const bundleExtensionInfo: NormalizedBundleExtension = {
			type: 'bundle',
			name: extensionInfo.name,
			local: extensionInfo.local,
			entries: extension.entries.map((entry) => ({
				name: entry.name,
				type: entry.type,
				settings: omit(settings.find(({ name }) => `${extension.name}/${entry.name}` === name)!, 'name'),
			})),
		};

		return bundleExtensionInfo;
	} else {
		return extensionInfo;
	}
};
