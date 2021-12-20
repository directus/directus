/* eslint-disable no-console */

import chalk from 'chalk';

export default function log(message: string, type?: 'info' | 'warn' | 'error'): void {
	if (type === 'info') {
		console.log(`${chalk.bold.gray('[Info]')} ${message}`);
	} else if (type === 'warn') {
		console.warn(`${chalk.bold.yellow('[Warn]')} ${message}`);
	} else if (type === 'error') {
		console.error(`${chalk.bold.red('[Error]')} ${message}`);
	} else {
		console.log(message);
	}
}
