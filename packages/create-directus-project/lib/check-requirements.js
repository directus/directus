/* eslint-disable no-console */

import chalk from 'chalk';

export default function checkRequirements() {
	const nodeVersion = process.versions.node;
	const nodeVersionSplit = nodeVersion.split('.');
	const major = +nodeVersionSplit[0];
	const minor = +nodeVersionSplit[1];

	if (major !== 18 || minor < 17) {
		console.error(`You are running ${chalk.red(`Node.js ${nodeVersion}`)}.`);

		console.error(
			`Directus requires ${chalk.green(`Node.js 18`)}, specifically version 18.17 or higher (>=18.17 & <19).`,
		);

		console.error('Please adjust your Node.js version and try again.');

		process.exit(1);
	}
}
