import { useEnv } from '@directus/env';
import { resolveDependencyExtensions, resolveExtensions } from '@directus/extensions/node';
import { useLogger } from '../../logger.js';
import { getExtensionsPath } from './get-extensions-path.js';

export const getExtensions = async () => {
	const env = useEnv();
	const logger = useLogger();

	const localExtensions = await resolveExtensions(getExtensionsPath());
	const localExtensionNames = localExtensions.map(({ name }) => name);

	/** Extensions that are listed as dependencies in the root package.json */
	const dependencyExtensions = await resolveDependencyExtensions(env['PACKAGE_FILE_LOCATION'] as string);

	const dedupedDependencyExtensions = dependencyExtensions.filter((ext) => {
		if (localExtensionNames.includes(ext.name)) {
			logger.warn(`Node module extension "${ext.name}" already exists within the extensions folder.`);
			return false;
		}

		return true;
	});

	return [...localExtensions, ...dedupedDependencyExtensions];
};
