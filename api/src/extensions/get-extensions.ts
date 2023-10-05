import { APP_EXTENSION_TYPES } from '@directus/constants';
import { getLocalExtensions, getPackageExtensions, resolvePackageExtensions } from '@directus/utils/node';
import env from '../env.js';

export const getExtensions = async () => {
	const packageExtensions = await getPackageExtensions(env['PACKAGE_FILE_LOCATION']);
	const localPackageExtensions = await resolvePackageExtensions(env['EXTENSIONS_PATH']);
	const localExtensions = await getLocalExtensions(env['EXTENSIONS_PATH']);

	return [...packageExtensions, ...localPackageExtensions, ...localExtensions].filter(
		(extension) => env['SERVE_APP'] || APP_EXTENSION_TYPES.includes(extension.type as any) === false
	);
};
