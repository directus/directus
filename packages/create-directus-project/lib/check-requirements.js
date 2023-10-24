/* eslint-disable no-console */

const chalk = require('chalk');

module.exports = function checkRequirements() {
	const nodeVersion = process.versions.node;
	const major = +nodeVersion.split('.')[0];

	if (major < 12) {
		console.error(`You are running ${chalk.red(`Node ${nodeVersion}`)}.`);
		console.error(`Directus requires ${chalk.green(`Node 12`)} and up.`);
		console.error('Please update your Node version and try again.');
		process.exit(1);
	}
};
