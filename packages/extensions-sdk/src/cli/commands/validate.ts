import { EXTENSION_PKG_KEY, EXTENSION_TYPES } from '@directus/extensions';
import chalk from 'chalk';
import fse from 'fs-extra';
import ora from 'ora';
import { log } from '../utils/logger.js';

export default async function validate(): Promise<void> {
	const spinner = ora(chalk.bold('Validating Directus extension...')).start();

	try {
		await Promise.all([checkBuiltCode(), checkReadMe(), checkLicense(), checkDirectusConfig()]);

		spinner.succeed(chalk.bold('Extension is valid'));
	} catch (error) {
		spinner.fail(chalk.bold('Failed validation'));
		log(String(error), 'error');
	}
}

async function checkBuiltCode() {
	const spinner = ora('Check for /dist').start();

	if (!(await fse.pathExists(`${process.cwd()}/dist`))) {
		spinner.fail();
		return Promise.reject('No /dist directory');
	}

	spinner.succeed('Valid /dist');
	return true;
}

async function checkReadMe() {
	const spinner = ora('Check for README').start();

	if (!(await fse.pathExists(`${process.cwd()}/README.md`))) {
		spinner.fail();
		return Promise.reject('No README.md');
	}

	spinner.succeed('Valid README');
	return true;
}

async function checkLicense() {
	const spinner = ora('Check for LICENSE').start();

	if (!(await fse.pathExists(`${process.cwd()}/LICENSE`))) {
		spinner.fail();
		return Promise.reject('No LICENSE file');
	}

	spinner.succeed('Valid LICENSE');
	return true;
}

async function checkDirectusConfig() {
	const spinner = ora(`Checking ${EXTENSION_PKG_KEY} Object`).start();

	spinner.text = 'Checking package file exists';

	if (!(await fse.pathExists(`${process.cwd()}/package.json`))) {
		spinner.fail();
		return Promise.reject('No package.json');
	}

	const packageFile = await fse.readJson(`${process.cwd()}/package.json`);

	spinner.text = `Checking ${EXTENSION_PKG_KEY} is present`;

	if (!packageFile[EXTENSION_PKG_KEY]) {
		spinner.fail();
		return Promise.reject('Directus object not found');
	}

	const { type, path, host } = packageFile[EXTENSION_PKG_KEY];

	spinner.text = `Checking extension type`;

	if (!EXTENSION_TYPES.includes(type)) {
		spinner.fail();
		return Promise.reject(`Invalid Directus Extension Type: ${type}`);
	}

	spinner.text = `Checking extension path`;

	if (!(await fse.pathExists(`${process.cwd()}/${path}`))) {
		spinner.fail();
		return Promise.reject(`Extension path ${path} invalid`);
	}

	spinner.text = 'Checking for valid Directus host version';

	const regex = new RegExp(/^\^?[1-9]\d*(\.[1-9]\d*)*/);

	if (!regex.test(host)) {
		spinner.fail();
		return Promise.reject(`${host} not a valid Directus version`);
	}

	spinner.succeed(`Valid ${EXTENSION_PKG_KEY} Object`);
	return true;
}
