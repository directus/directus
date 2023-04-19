import { pathToRelativeUrl } from '@directus/utils/node';
import fse from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Config } from '../../types.js';

export const CONFIG_FILE_NAMES = ['extension.config.js', 'extension.config.mjs', 'extension.config.cjs'];

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function loadConfig(): Promise<Config> {
	for (const fileName of CONFIG_FILE_NAMES) {
		if (await fse.pathExists(fileName)) {
			const configFile = await import(pathToRelativeUrl(path.resolve(fileName), __dirname));

			return configFile.default;
		}
	}

	return {};
}
