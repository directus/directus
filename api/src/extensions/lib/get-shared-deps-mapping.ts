import { readdir } from 'node:fs/promises';
import path from 'path';
import { useEnv } from '@directus/env';
import { resolvePackage } from '@directus/utils/node';
import { escapeRegExp } from 'lodash-es';
import { useLogger } from '../../logger/index.js';
import { Url } from '../../utils/url.js';

export const getSharedDepsMapping = async (deps: readonly string[]): Promise<Record<string, string>> => {
	const { PUBLIC_URL } = useEnv();
	const logger = useLogger();

	const appDir = await readdir(path.join(resolvePackage('@directus/app', import.meta.dirname), 'dist', 'assets'));
	const depsMapping: Record<string, string> = {};

	for (const dep of deps) {
		const depRegex = new RegExp(`${escapeRegExp(dep.replace(/\//g, '_'))}\\.[a-zA-Z0-9_-]{8}\\.entry\\.js`);
		const depName = appDir.find((file) => depRegex.test(file));

		if (depName) {
			const depUrl = new Url(PUBLIC_URL).addPath('admin', 'assets', depName);

			depsMapping[dep] = depUrl.toString({ rootRelative: true });
		} else {
			logger.warn(`Couldn't find shared extension dependency "${dep}"`);
		}
	}

	return depsMapping;
};
