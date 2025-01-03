import { EXTENSION_PKG_KEY, EXTENSION_TYPES, API_EXTENSION_TYPES } from '@directus/extensions';
import fse from 'fs-extra';
import { type Ora } from 'ora';
import type { Report } from '../../types.js';
import { isObject } from '@directus/utils';

const checkDirectusConfig = {
	name: 'directus-config',
	handler: async (spinner: Ora, reports: Array<Report>) => {
		spinner.text = 'Checking package file exists';

		if (!(await fse.pathExists(`${process.cwd()}/package.json`))) {
			spinner.fail();

			const message = 'No package.json';

			reports.push({
				level: 'error',
				message: `${checkDirectusConfig.name}: ${message}`,
			});

			throw new Error(message);
		}

		const packageFile = await fse.readJson(`${process.cwd()}/package.json`);

		spinner.text = `Checking ${EXTENSION_PKG_KEY} is present`;

		if (!packageFile[EXTENSION_PKG_KEY]) {
			spinner.fail();

			const message = 'Directus object not found';

			reports.push({
				level: 'error',
				message: `${checkDirectusConfig.name}: ${message}`,
			});

			throw new Error(message);
		}

		const { type, host, sandbox } = packageFile[EXTENSION_PKG_KEY];
		let { path } = packageFile[EXTENSION_PKG_KEY];

		spinner.text = `Checking extension type`;

		if (!EXTENSION_TYPES.includes(type)) {
			spinner.fail();
			const message = `Invalid Directus Extension Type: ${type}`;

			reports.push({
				level: 'error',
				message: `${checkDirectusConfig.name}: ${message}`,
			});

			throw new Error(message);
		}

		spinner.text = `Checking extension path(s)`;

		if (!isObject(path)) {
			path = { app: path };
		}

		Object.keys(path).forEach(async (key) => {
			if (!(await fse.pathExists(`${process.cwd()}/${path[key]}`))) {
				spinner.fail();
				const message = `Extension path ${key}: ${path[key]} invalid`;

				reports.push({
					level: 'error',
					message: `${checkDirectusConfig.name}: ${message}`,
				});

				throw new Error(message);
			}
		});

		spinner.text = 'Checking for valid Directus host version';

		const regex = new RegExp(/^\^?[1-9]\d*(\.[1-9]\d*)*/);

		if (!regex.test(host)) {
			spinner.fail();
			const message = `${host} not a valid Directus version`;

			reports.push({
				level: 'error',
				message: `${checkDirectusConfig.name}: ${message}`,
			});

			throw new Error(message);
		}

		spinner.text = 'Checking if it will publish to the Directus Marketplace';

		if (type === 'bundle' || (!sandbox?.enabled && API_EXTENSION_TYPES.findIndex(type) >= 0)) {
			reports.push({
				level: 'warn',
				message: `${checkDirectusConfig.name}: Extension won't be generally visible in the Directus Marketplace`,
			});
		}

		const message = `Valid ${EXTENSION_PKG_KEY} Object`;

		reports.push({
			level: 'info',
			message: `${checkDirectusConfig.name}: ${message}`,
		});

		return (spinner.text = message);
	},
};

export default checkDirectusConfig;
