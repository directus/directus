import { pathToRelativeUrl } from '@directus/utils/node';
import fse from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Config } from '../../types.js';

export const CONFIG_FILE_NAMES = ['extension.config.js', 'extension.config.mjs', 'extension.config.cjs'];

// This is needed to work around Typescript always transpiling import() to require() for CommonJS targets.
const _import = new Function('url', 'return import(url)');
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function loadConfig(): Promise<Config> {
	for (const fileName of CONFIG_FILE_NAMES) {
		if (await fse.pathExists(fileName)) {
			const configFile = await _import(pathToRelativeUrl(path.resolve(fileName), __dirname));

			return configFile.default;
		}
	}

	return {};
}
