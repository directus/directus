/* eslint-disable no-console */

import chalk from 'chalk';

/**
 * Checks if the current Node.js version meets the requirements for Directus.
 *
 * Validates that the current Node.js major version is at least the minimum supported version,
 * matching the `engines.node` range (`>=26`) the published packages declare. If it is older,
 * displays an error message and exits the process.
 *
 * @throws {void} Exits the process with code 1 if Node.js version is incompatible
 */
export default function checkRequirements() {
	const nodeVersion = process.versions.node;
	const currentMajor = +nodeVersion.split('.')[0];

	const minimumMajor = 26;

	if (currentMajor < minimumMajor) {
		console.error(`You are running ${chalk.red(`Node.js ${nodeVersion}`)}.`);
		console.error(`Directus requires ${chalk.green(`Node.js ${minimumMajor}`)} or newer.`);
		console.error('Please adjust your Node.js version and try again.');

		process.exit(1);
	}
}
