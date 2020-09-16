import listFolders from '../utils/list-folders';
import path from 'path';
import env from '../env';
import { ServiceUnavailableException } from '../exceptions';

export default class ExtensionsService {
	async listExtensions(type: string) {
		const extensionsPath = env.EXTENSIONS_PATH as string;
		const location = path.join(extensionsPath, type);

		try {
			return await listFolders(location);
		} catch (err) {
			if (err.code === 'ENOENT') {
				throw new ServiceUnavailableException(`Extension folder couldn't be opened`, {
					service: 'extensions',
				});
			}
			console.log(err);
		}
	}
}
