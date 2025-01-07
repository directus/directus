import { EXTENSION_PKG_KEY, EXTENSION_TYPES, API_EXTENSION_TYPES } from '@directus/extensions';
import fse from 'fs-extra';
import path from 'path';
import { type Ora } from 'ora';
import semver from 'semver';
import type { Report } from '../../types.js';
import { isObject } from '@directus/utils';

const checkDirectusConfig = {
	name: 'directus-config',
	handler: async (spinner: Ora, reports: Array<Report>) => {
		spinner.text = 'Checking package file exists';

		const packagePath = path.resolve(process.cwd(), 'package.json');

		if (!(await fse.pathExists(packagePath))) {
			spinner.fail();

			const message = 'No package.json';

			reports.push({
				level: 'error',
				message: `${checkDirectusConfig.name}: ${message}`,
			});

			throw new Error(message);
		}

		const packageFile = await fse.readJson(packagePath);

		spinner.text = `Checking ${EXTENSION_PKG_KEY} is present`;

		if (!packageFile[EXTENSION_PKG_KEY]) {
			spinner.fail();

			const message = `"directus:extension" not found in ${packagePath}`;

			reports.push({
				level: 'error',
				message: `${checkDirectusConfig.name}: ${message}`,
			});

			throw new Error(message);
		}

		const packageObject = packageFile[EXTENSION_PKG_KEY];
		const { type, host, sandbox } = packageObject;
		let extensionPath = packageObject.path;

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

		if (!isObject(extensionPath)) {
			extensionPath = { app: extensionPath };
		}

		Object.keys(extensionPath).forEach(async (key) => {
			if (!(await fse.pathExists(path.resolve(process.cwd(), extensionPath[key])))) {
				spinner.fail();
				const message = `Extension path ${key}: ${extensionPath[key]} invalid`;

				reports.push({
					level: 'error',
					message: `${checkDirectusConfig.name}: ${message}`,
				});

				throw new Error(message);
			}
		});

		spinner.text = 'Checking for valid Directus host version';

		if (!semver.validRange(host)) {
			spinner.fail();
			const message = `${host} not a valid Directus version`;

			reports.push({
				level: 'error',
				message: `${checkDirectusConfig.name}: ${message}`,
			});

			throw new Error(message);
		}

		spinner.text = 'Checking if it will publish to the Directus Marketplace';

		if (type === 'bundle' || (sandbox && !sandbox?.enabled && API_EXTENSION_TYPES.findIndex(type) >= 0)) {
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
