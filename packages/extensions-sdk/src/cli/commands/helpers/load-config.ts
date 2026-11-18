import path from 'path';
import { fileURLToPath } from 'url';
import { JAVASCRIPT_FILE_EXTS } from '@directus/constants';
import { pathExists, pathToRelativeUrl } from '@directus/utils/node';
import type { Config } from '../../types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function loadConfig(): Promise<Config> {
	for (const ext of JAVASCRIPT_FILE_EXTS) {
		const fileName = `extension.config.${ext}`;

		if (await pathExists(fileName)) {
			const configFile = await import(pathToRelativeUrl(path.resolve(fileName), __dirname));

			return configFile.default;
		}
	}

	return {};
}
