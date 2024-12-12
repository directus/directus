/* eslint-disable no-console */

import chalk from 'chalk';

export default function checkRequirements() {
	const nodeVersion = process.versions.node;
	const nodeVersionSplit = nodeVersion.split('.');
	const major = +nodeVersionSplit[0];
	const minor = +nodeVersionSplit[1];

	if (major !== 22 || minor < 22) {
		console.error(`You are running ${chalk.red(`Node.js ${nodeVersion}`)}.`);

		console.error(
			`Directus requires ${chalk.green(`Node.js 22`)}, specifically version 22.12 or higher (>=22.12 & <23).`,
		);

		console.error('Please adjust your Node.js version and try again.');

		process.exit(1);
	}
}
