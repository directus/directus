import { resolvePackage } from '@directus/utils/node';
import { escapeRegExp } from 'lodash-es';
import { readdir } from 'node:fs/promises';
import path from 'path';
import env from '../../env.js';
import logger from '../../logger.js';
import { Url } from '../../utils/url.js';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const getSharedDepsMapping = async (deps: string[]): Promise<Record<string, string>> => {
	const appDir = await readdir(path.join(resolvePackage('@directus/app', __dirname), 'dist', 'assets'));

	const depsMapping: Record<string, string> = {};

	for (const dep of deps) {
		const depRegex = new RegExp(`${escapeRegExp(dep.replace(/\//g, '_'))}\\.[0-9a-f]{8}\\.entry\\.js`);
		const depName = appDir.find((file) => depRegex.test(file));

		if (depName) {
			const depUrl = new Url(env['PUBLIC_URL']).addPath('admin', 'assets', depName);

			depsMapping[dep] = depUrl.toString({ rootRelative: true });
		} else {
			logger.warn(`Couldn't find shared extension dependency "${dep}"`);
		}
	}

	return depsMapping;
};
