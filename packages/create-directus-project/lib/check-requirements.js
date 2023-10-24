/* eslint-disable no-console */

import chalk from 'chalk';

export default function checkRequirements() {
	const nodeVersion = process.versions.node;
	const major = +nodeVersion.split('.')[0];

	if (major < 18) {
		console.error(`You are running ${chalk.red(`Node ${nodeVersion}`)}.`);
		console.error(`Directus requires ${chalk.green(`Node 18`)} and up.`);
		console.error('Please update your Node version and try again.');
		process.exit(1);
	}
}
