import { resolveDependencyExtensions, resolveExtensions } from '@directus/extensions/node';
import env from '../../env.js';
import logger from '../../logger.js';
import { getExtensionsPath } from './get-extensions-path.js';

export const getExtensions = async () => {
	const extensions = await resolveExtensions(getExtensionsPath());
	const extensionNames = extensions.map(({ name }) => name);

	/** Extensions that are listed in the root package.json dependencies */
	const dependencyExtensions = await resolveDependencyExtensions(env['PACKAGE_FILE_LOCATION']);

	const dedupedDependencyExtensions = dependencyExtensions.filter((ext) => {
		if (extensionNames.includes(ext.name)) {
			logger.warn(`Node module extension "${ext.name}" already exists within the extensions folder.`);
			return false;
		}

		return true;
	});

	return [...extensions, ...dedupedDependencyExtensions];
};
