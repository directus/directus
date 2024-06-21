import { JAVASCRIPT_FILE_EXTS } from '@directus/constants';
import { pathToRelativeUrl } from '@directus/utils/node';
import fse from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Config } from '../../types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function loadConfig(mode: 'browser' | 'node'): Promise<Config> {
	for (const ext of JAVASCRIPT_FILE_EXTS) {
		// Try to find a config file for the given mode first, then default to the generic one
		for (const modeSuffix of [`.${mode}`, '']) {
			const fileName = `extension.config${modeSuffix}.${ext}`;

			if (await fse.pathExists(fileName)) {
				const configFile = await import(pathToRelativeUrl(path.resolve(fileName), __dirname));

				return configFile.default;
			}
		}
	}

	return {};
}
