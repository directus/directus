import { EXTENSION_PKG_KEY, EXTENSION_TYPES } from '@directus/extensions';
import chalk from 'chalk';
import fse from 'fs-extra';
import ora from 'ora';
import { log } from '../utils/logger.js';

export default async function validate(): Promise<void> {
	const spinner = ora(chalk.bold('Validating Directus extension...')).start();

	try {
		const result = await Promise.allSettled([checkDirectusConfig(), checkBuiltCode(), checkReadMe(), checkLicense()]);

		const rejectedChecks = result.filter((value) => {
			return value.status === 'rejected';
		});

		if (rejectedChecks.length) {
			spinner.suffixText = rejectedChecks
				.map((error) => {
					return error.reason.message;
				})
				.join('\n ');

			spinner.fail(chalk.bold('Failed validation: \n'));
		} else {
			spinner.succeed(chalk.bold('Extension is valid'));
		}
	} catch (error) {
		spinner.fail(chalk.bold('Failed validation'));
		log(String(error), 'error');
	}
}

async function checkBuiltCode() {
	const spinner = ora('Check for built code').start();

	let codePath = '/dist';

	if (await fse.pathExists(`${process.cwd()}/package.json`)) {
		const packageFile = await fse.readJson(`${process.cwd()}/package.json`);

		if (packageFile[EXTENSION_PKG_KEY]) {
			const { path } = packageFile[EXTENSION_PKG_KEY];
			spinner.text = `Path ${path} found in ${EXTENSION_PKG_KEY}`;
			codePath = path;
		}
	}

	if (!(await fse.pathExists(`${process.cwd()}/${codePath}`))) {
		spinner.fail();
		throw new Error(`No ${codePath} directory`);
	}

	return spinner.succeed('Valid built code directory');
}

async function checkReadMe() {
	const spinner = ora('Check for README').start();

	if (!(await fse.pathExists(`${process.cwd()}/README.md`))) {
		spinner.fail();
		throw new Error('No README.md');
	}

	return spinner.succeed('Valid README');
}

async function checkLicense() {
	const spinner = ora('Check for LICENSE').start();

	if (!(await fse.pathExists(`${process.cwd()}/LICENSE`))) {
		spinner.fail();
		throw new Error('No LICENSE file');
	}

	return spinner.succeed('Valid LICENSE');
}

async function checkDirectusConfig() {
	const spinner = ora(`Checking ${EXTENSION_PKG_KEY} Object`).start();

	spinner.text = 'Checking package file exists';

	if (!(await fse.pathExists(`${process.cwd()}/package.json`))) {
		spinner.fail();
		throw new Error('No package.json');
	}

	const packageFile = await fse.readJson(`${process.cwd()}/package.json`);

	spinner.text = `Checking ${EXTENSION_PKG_KEY} is present`;

	if (!packageFile[EXTENSION_PKG_KEY]) {
		spinner.fail();
		throw new Error('Directus object not found');
	}

	const { type, path, host } = packageFile[EXTENSION_PKG_KEY];

	spinner.text = `Checking extension type`;

	if (!EXTENSION_TYPES.includes(type)) {
		spinner.fail();
		throw new Error(`Invalid Directus Extension Type: ${type}`);
	}

	spinner.text = `Checking extension path`;

	if (!(await fse.pathExists(`${process.cwd()}/${path}`))) {
		spinner.fail();
		throw new Error(`Extension path ${path} invalid`);
	}

	spinner.text = 'Checking for valid Directus host version';

	const regex = new RegExp(/^\^?[1-9]\d*(\.[1-9]\d*)*/);

	if (!regex.test(host)) {
		spinner.fail();
		throw new Error(`${host} not a valid Directus version`);
	}

	return spinner.succeed(`Valid ${EXTENSION_PKG_KEY} Object`);
}
