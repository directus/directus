import { join } from 'node:path';
import { useEnv } from '@directus/env';
import { resolveFsExtensions, resolveModuleExtensions } from '@directus/extensions/node';
import type { Extension } from '@directus/types';
import { getExtensionsPath } from './get-extensions-path.js';

export const getExtensions = async () => {
	const env = useEnv();

	const localExtensions = await resolveFsExtensions(getExtensionsPath());
	const registryExtensions = await resolveFsExtensions(join(getExtensionsPath(), '.registry'));

	/** Extensions that are listed as dependencies in the root package.json */
	const moduleExtensions = await resolveModuleExtensions(env['PACKAGE_FILE_LOCATION'] as string);

	// Duplicate type+name precedence: local > registry > module
	removeDuplicates(registryExtensions, [localExtensions]);
	removeDuplicates(moduleExtensions, [localExtensions, registryExtensions]);

	return { local: localExtensions, registry: registryExtensions, module: moduleExtensions };
};

function removeDuplicates(extensions: Map<string, Extension>, preferred: Map<string, Extension>[]) {
	const preferredKeys = new Set(preferred.flatMap((map) => [...map.values()].map(key)));

	for (const [folder, extension] of extensions) {
		if (preferredKeys.has(key(extension))) extensions.delete(folder);
	}
}

function key({ type, name }: Extension) {
	return `${type}:${name}`;
}
