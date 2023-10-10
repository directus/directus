import { getLocalExtensions, getPackageExtensions, resolvePackageExtensions } from '@directus/extensions/node';
import env from '../env.js';

export const getExtensions = async () => {
	const packageExtensions = await getPackageExtensions(env['PACKAGE_FILE_LOCATION']);
	const localPackageExtensions = await resolvePackageExtensions(env['EXTENSIONS_PATH']);
	const localExtensions = await getLocalExtensions(env['EXTENSIONS_PATH']);

	return [...packageExtensions, ...localPackageExtensions, ...localExtensions];
};
