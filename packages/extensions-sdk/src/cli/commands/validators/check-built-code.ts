import { EXTENSION_PKG_KEY } from '@directus/extensions';
import fse from 'fs-extra';
import { type Ora } from 'ora';
import type { Report } from '../../types.js';

const checkBuiltCode = {
	name: 'built-code',
	handler: async (spinner: Ora, reports: Array<Report>) => {
		spinner.text = 'Check for built code';

		let codePath = '/dist';

		if (await fse.pathExists(`${process.cwd()}/package.json`)) {
			const packageFile = await fse.readJson(`${process.cwd()}/package.json`);

			if (packageFile[EXTENSION_PKG_KEY]) {
				const { path } = packageFile[EXTENSION_PKG_KEY];
				const message = `Path ${path} found in ${EXTENSION_PKG_KEY}`;
				spinner.text = message;

				reports.push({
					level: 'info',
					message: `${checkBuiltCode.name}: ${message}`,
				});

				codePath = path;
			}
		}

		if (!(await fse.pathExists(`${process.cwd()}/${codePath}`))) {
			spinner.fail();
			const message = `No ${codePath} directory`;

			reports.push({
				level: 'error',
				message: `${checkBuiltCode.name}: ${message}`,
			});

			throw new Error(message);
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
