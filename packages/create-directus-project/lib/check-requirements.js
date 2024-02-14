/* eslint-disable no-console */

import chalk from 'chalk';

export default function checkRequirements() {
	const nodeVersion = process.versions.node.split('.');
	const major = +nodeVersion[0];
	const minor = +nodeVersion[1];

	if (major < 18 || minor < 17) {
		console.error(`You are running ${chalk.red(`Node ${nodeVersion}`)}.`);
		console.error(`Directus requires ${chalk.green(`Node.js 18.17`)} and up.`);
		console.error('Please update your Node.js version and try again.');
		process.exit(1);
	}
}
