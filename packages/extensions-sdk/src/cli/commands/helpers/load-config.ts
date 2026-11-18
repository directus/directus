import path from 'path';
import { JAVASCRIPT_FILE_EXTS } from '@directus/constants';
import { pathExists, pathToRelativeUrl } from '@directus/utils/node';
import type { Config } from '../../types.js';

export default async function loadConfig(): Promise<Config> {
	for (const ext of JAVASCRIPT_FILE_EXTS) {
		const fileName = `extension.config.${ext}`;

		if (await pathExists(fileName)) {
			const configFile = await import(pathToRelativeUrl(path.resolve(fileName), import.meta.dirname));

			return configFile.default;
		}
	}

	return {};
}
