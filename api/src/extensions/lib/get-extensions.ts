import { useEnv } from '@directus/env';
import { resolveLocalExtensions, resolvePackageExtensions } from '@directus/extensions/node';
import { useLogger } from '../../logger.js';
import { getExtensionsPath } from './get-extensions-path.js';

export const getExtensions = async () => {
	const env = useEnv();
	const logger = useLogger();

	const localExtensions = await resolveLocalExtensions(getExtensionsPath());
	const localExtensionNames = localExtensions.map(({ name }) => name);

	/** Extensions that are listed as dependencies in the root package.json */
	const packageExtensions = await resolvePackageExtensions(env['PACKAGE_FILE_LOCATION'] as string);

	const dedupedPackageExtensions = packageExtensions.filter((ext) => {
		if (localExtensionNames.includes(ext.name)) {
			logger.warn(`Package extension "${ext.name}" skipped in favor of local extension with the same name.`);
			return false;
		}

		return true;
	});

	return [...localExtensions, ...dedupedPackageExtensions];
};
