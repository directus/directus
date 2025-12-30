import type { Report } from '../../types.js';
import { EXTENSION_PKG_KEY } from '@directus/extensions';
import fse from 'fs-extra';
import { type Ora } from 'ora';
import path from 'path';

const checkBuiltCode = {
	name: 'built-code',
	handler: async (spinner: Ora, reports: Array<Report>) => {
		spinner.text = 'Check for built code';

		let codePath: any = '/dist';
		const packagePath = path.resolve('package.json');

		if (await fse.pathExists(packagePath)) {
			const packageFile = await fse.readJson(packagePath);

			if (packageFile[EXTENSION_PKG_KEY]) {
				const { path } = packageFile[EXTENSION_PKG_KEY];

				if (path) {
					const message = `Path ${path} found in ${EXTENSION_PKG_KEY}`;
					spinner.text = message;

					reports.push({
						level: 'info',
						message: `${checkBuiltCode.name}: ${message}`,
					});

					codePath = path;
				}
			}
		}

		if (typeof codePath === 'string') {
			codePath = { app: codePath };
		}

		Object.keys(codePath).forEach(async (key) => {
			if (!(await fse.pathExists(path.resolve(codePath[key])))) {
				spinner.fail();
				const message = `No ${codePath[key]} directory`;

				reports.push({
					level: 'error',
					message: `${checkBuiltCode.name}: ${message}`,
				});

				throw new Error(message);
			}
		});

		const message = 'Valid built code directory';

		reports.push({
			level: 'info',
			message: `${checkBuiltCode.name}: ${message}`,
		});

		return (spinner.text = message);
	},
};

export default checkBuiltCode;
