import path from 'path';
import fse from 'fs-extra';
import { Config } from '../../types';
import { pathToRelativeUrl } from '@directus/shared/utils/node';

const CONFIG_FILE_NAMES = ['extension.config.js', 'extension.config.mjs', 'extension.config.cjs'];

// This is needed to work around Typescript always transpiling import() to require() for CommonJS targets.
const _import = new Function('url', 'return import(url)');

export default async function loadConfig(): Promise<Config> {
	for (const fileName of CONFIG_FILE_NAMES) {
		if (await fse.pathExists(fileName)) {
			const configFile = await _import(pathToRelativeUrl(path.resolve(fileName), __dirname));

			return configFile.default;
		}
	}

	return {};
}
