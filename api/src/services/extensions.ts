import listFolders from '../utils/list-folders';
import path from 'path';
import env from '../env';

/**
 * @TODO turn into class
 */

export async function listExtensions(type: string) {
	const extensionsPath = env.EXTENSIONS_PATH as string;
	const location = path.join(extensionsPath, type);

	return await listFolders(location);
}
