/* eslint-disable no-console */

import readline from 'readline';
import chalk from 'chalk';

export function log(message: string, type?: 'info' | 'warn' | 'error'): void {
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

export function clear() {
	const repeatCount = process.stdout.rows - 2;
	const blank = repeatCount > 0 ? '\n'.repeat(repeatCount) : '';
	console.log(blank);

	readline.cursorTo(process.stdout, 0, 0);
	readline.clearScreenDown(process.stdout);
}
