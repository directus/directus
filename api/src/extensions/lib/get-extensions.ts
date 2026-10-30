import { join } from 'node:path';
import { useEnv } from '@directus/env';
import { dedupeExtensions, resolveFsExtensions, resolveModuleExtensions } from '@directus/extensions/node';
import { useLogger } from '../../logger/index.js';
import { getExtensionsPath } from './get-extensions-path.js';

export const getExtensions = async () => {
	const env = useEnv();
	const logger = useLogger();

	const localExtensions = await resolveFsExtensions(getExtensionsPath());
	const registryExtensions = await resolveFsExtensions(join(getExtensionsPath(), '.registry'));

	/** Extensions that are listed as dependencies in the root package.json */
	const moduleExtensions = await resolveModuleExtensions(env['PACKAGE_FILE_LOCATION'] as string);

	const { extensions, shadowed } = dedupeExtensions({
		local: localExtensions,
		registry: registryExtensions,
		module: moduleExtensions,
	});

	for (const { source, folder, extension, shadowedBy } of shadowed) {
		logger.warn(
			`Skipping extension "${extension.name}" from ${source}/${folder}, already loaded from ${shadowedBy.source}/${shadowedBy.folder}`,
		);
	}

	return extensions;
};
