/* eslint-disable no-console */

import { readFileSync } from 'node:fs';
import chalk from 'chalk';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

/**
 * Checks if the current Node.js version meets the requirements for Directus.
 *
 * Validates that the current Node.js major version is at least the minimum one in `engines.node` of this package.
 * If it is older, displays an error message and exits the process.
 *
 * @throws {void} Exits the process with code 1 if Node.js version is incompatible
 */
export default function checkRequirements() {
	const nodeVersion = process.versions.node;
	const currentMajor = +nodeVersion.split('.')[0];

	const minimumMajor = getMinimumMajor();

	if (currentMajor < minimumMajor) {
		console.error(`You are running ${chalk.red(`Node.js ${nodeVersion}`)}.`);
		console.error(`Directus requires ${chalk.green(`Node.js ${minimumMajor}`)} or newer.`);
		console.error('Please adjust your Node.js version and try again.');

		process.exit(1);
	}
}

/**
 * Get the minimum supported Node.js major version from `engines.node` of this package.
 *
 * @returns {number} The minimum supported major version
 */
export function getMinimumMajor() {
	return +pkg.engines.node.match(/\d+/)[0];
}
