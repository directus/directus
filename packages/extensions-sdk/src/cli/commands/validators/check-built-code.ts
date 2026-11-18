import path from 'path';
import { EXTENSION_PKG_KEY } from '@directus/extensions';
import { pathExists } from '@directus/utils/node';
import { type Ora } from 'ora';
import type { Report } from '../../types.js';
import { readJson } from '../../utils/json.js';

const checkBuiltCode = {
	name: 'built-code',
	handler: async (spinner: Ora, reports: Array<Report>): Promise<string> => {
		spinner.text = 'Check for built code';

		let codePaths = ['dist'];
		const packagePath = path.resolve('package.json');

		if (await pathExists(packagePath)) {
			const packageFile = await readJson(packagePath);
			const extensionPath = packageFile[EXTENSION_PKG_KEY]?.path;

			if (extensionPath) {
				codePaths = typeof extensionPath === 'string' ? [extensionPath] : Object.values(extensionPath);

				const message = `Path ${codePaths.join(', ')} found in ${EXTENSION_PKG_KEY}`;
				spinner.text = message;

				reports.push({
					level: 'info',
					message: `${checkBuiltCode.name}: ${message}`,
				});
			}
		}

		for (const builtPath of codePaths) {
			if (!(await pathExists(path.resolve(builtPath)))) {
				spinner.fail();
				const message = `No ${builtPath} directory`;

				reports.push({
					level: 'error',
					message: `${checkBuiltCode.name}: ${message}`,
				});

				throw new Error(message);
			}
		}

		const message = 'Valid built code directory';

		reports.push({
			level: 'info',
			message: `${checkBuiltCode.name}: ${message}`,
		});

		return (spinner.text = message);
	},
};

export default checkBuiltCode;
