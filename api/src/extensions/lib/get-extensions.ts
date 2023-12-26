import type { Extension } from '@directus/extensions';
import { getLocalExtensions, getPackageExtensions, resolvePackageExtensions } from '@directus/extensions/node';
import { useEnv } from '../../env.js';
import { useLogger } from '../../logger.js';
import { getExtensionsPath } from './get-extensions-path.js';

export const getExtensions = async () => {
	const env = useEnv();
	const logger = useLogger();

	const loadedExtensions = new Map();
	const duplicateExtensions: string[] = [];

	const filterDuplicates = (extension: Extension) => {
		const isExistingExtension = loadedExtensions.has(extension.name);

		if (isExistingExtension) {
			duplicateExtensions.push(extension.name);
			return;
		}

		if (extension.type === 'bundle') {
			const bundleEntryNames = new Set();

			for (const entry of extension.entries) {
				if (bundleEntryNames.has(entry.name)) {
					// Do not load entire bundle if it has duplicated entries
					duplicateExtensions.push(extension.name);
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

	if (duplicateExtensions.length > 0) {
		logger.warn(
			`Failed to load the following extensions because they have/contain duplicate names: ${duplicateExtensions.join(
				', ',
			)}`,
		);
	}

	return Array.from(loadedExtensions.values());
};
