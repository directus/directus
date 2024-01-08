import { useEnv } from '@directus/env';
import { resolveDependencyExtensions, resolveExtensions } from '@directus/extensions/node';
import { useLogger } from '../../logger.js';
import { getExtensionsPath } from './get-extensions-path.js';

export const getExtensions = async () => {
	const env = useEnv();
	const logger = useLogger();
	const extensions = await resolveExtensions(getExtensionsPath());
	const extensionNames = extensions.map(({ name }) => name);

	/** Extensions that are listed in the root package.json dependencies */
	const dependencyExtensions = await resolveDependencyExtensions(env['PACKAGE_FILE_LOCATION'] as string);

	const dedupedDependencyExtensions = dependencyExtensions.filter((ext) => {
		if (extensionNames.includes(ext.name)) {
			logger.warn(`Node module extension "${ext.name}" already exists within the extensions folder.`);
			return false;
		}

		return true;
	});

	return [...extensions, ...dedupedDependencyExtensions];
};
