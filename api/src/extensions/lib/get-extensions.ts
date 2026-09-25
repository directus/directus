import { join } from 'node:path';
import { useEnv } from '@directus/env';
import { resolveFsExtensions, resolveModuleExtensions } from '@directus/extensions/node';
import { getExtensionsPath } from './get-extensions-path.js';

export const getExtensions = async () => {
	const { PACKAGE_FILE_LOCATION } = useEnv();

	const localExtensions = await resolveFsExtensions(getExtensionsPath());
	const registryExtensions = await resolveFsExtensions(join(getExtensionsPath(), '.registry'));

	/** Extensions that are listed as dependencies in the root package.json */
	const moduleExtensions = await resolveModuleExtensions(PACKAGE_FILE_LOCATION);

	return { local: localExtensions, registry: registryExtensions, module: moduleExtensions };
};
