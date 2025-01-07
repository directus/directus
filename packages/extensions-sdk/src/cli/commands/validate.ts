import chalk from 'chalk';
import ora from 'ora';
import { log } from '../utils/logger.js';

import validators from './validators/index.js';
import type { Report } from '../types.js';

type ValidateOptions = {
	check?: string;
	verbose?: boolean;
};

export default async function validate(options: ValidateOptions): Promise<void> {
	const spinner = ora(chalk.bold('Validating Directus extension...')).start();
	const reports: Array<Report> = [];

	try {
		const filteredValidators = validators.filter((value) => {
			if (options.check) {
				return options.check.toLowerCase() === value.name.toLowerCase();
			}

			return true;
		});

		if (filteredValidators.length === 0) {
			throw new Error(`No validator selected`);
		}

		const result = await Promise.allSettled(
			filteredValidators.map((value) => value.handler(spinner, reports)),
		);

		const rejectedChecks = result.filter((value) => value.status === 'rejected');

		if (rejectedChecks.length) {
			spinner.fail(chalk.bold('Failed validation: '));
			options.verbose = true;
		} else {
			spinner.succeed(chalk.bold('Extension is valid'));
		}
	} catch (error) {
		spinner.fail(chalk.bold('Failed validation: '));
		log(String(error), 'error');
	}

	if (options.verbose ?? false) {
		reports
			.sort((a, b) => {
				if (a.message < b.message) {
					return -1;
				}

				if (a.message > b.message) {
					return 1;
				}

				return 0;
			})
			.forEach(({ level, message }) => {
				log(message, level);
			});
	}
}
