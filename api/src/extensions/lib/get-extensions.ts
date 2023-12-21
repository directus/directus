import type { Extension } from '@directus/extensions';
import { getLocalExtensions, getPackageExtensions, resolvePackageExtensions } from '@directus/extensions/node';
import env from '../../env.js';
import { getExtensionsPath } from './get-extensions-path.js';

export const getExtensions = async () => {
	const loadedExtensions = new Map();

	const filterDuplicates = (extension: Extension) => {
		const isExistingExtension = loadedExtensions.has(extension.name);

		if (isExistingExtension) {
			return;
		}

		if (extension.type === 'bundle') {
			const bundleEntryNames = new Set();

			for (const entry of extension.entries) {
				if (bundleEntryNames.has(entry.name)) {
					// Do not load entire bundle if it has duplicated entries
					return;
				}

				bundleEntryNames.add(entry.name);
			}
		}

		loadedExtensions.set(extension.name, extension);
	};

	(await getLocalExtensions(getExtensionsPath())).forEach(filterDuplicates);

	(await resolvePackageExtensions(getExtensionsPath())).forEach(filterDuplicates);

	(await getPackageExtensions(env['PACKAGE_FILE_LOCATION'])).forEach(filterDuplicates);


	return Array.from(loadedExtensions.values());
};
