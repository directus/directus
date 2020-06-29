import listFolders from '../utils/list-folders';
import path from 'path';

export async function listExtensions(type: string) {
	const extensionsPath = process.env.EXTENSIONS_PATH;
	const location = path.join(extensionsPath, type);

	return await listFolders(location);
}
