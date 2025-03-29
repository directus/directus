/* eslint-disable no-console */

import chalk from 'chalk';

export default function checkRequirements() {
	const nodeVersion = process.versions.node;
	const currentMajor = +nodeVersion.split('.')[0];

	const expectedMajor = 22;

	if (currentMajor !== expectedMajor) {
		console.error(`You are running ${chalk.red(`Node.js ${nodeVersion}`)}.`);
		console.error(`Directus requires ${chalk.green(`Node.js ${expectedMajor}`)}.`);
		console.error('Please adjust your Node.js version and try again.');

		process.exit(1);
	}
}
