import listFolders from '../utils/list-folders';
import path from 'path';
import APIError, { ErrorCode } from '../error';

export async function listExtensions(type: string) {
	const extensionsPath = process.env.EXTENSIONS_PATH;
	const location = path.join(extensionsPath, type);

	try {
		return await listFolders(location);
	} catch (err) {
		if (err.code === 'ENOENT') {
			throw new APIError(ErrorCode.ENOENT, `The ${type} folder doesn't exist.`);
		}

		throw err;
	}
}
