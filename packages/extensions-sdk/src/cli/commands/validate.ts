import chalk from 'chalk';
import ora from 'ora';
import type { Report } from '../types.js';
import { log } from '../utils/logger.js';
import validators from './validators/index.js';

type ValidateOptions = {
	check?: string;
	verbose?: boolean;
};

const printReport = (reports: Array<Report>) => {
	reports
		.sort((a, b) => a.message.localeCompare(b.message))
		.forEach(({ level, message }) => {
			log(message, level);
		});
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

		const result = await Promise.allSettled(filteredValidators.map((value) => value.handler(spinner, reports)));

		const rejectedChecks = result.filter((value) => value.status === 'rejected');

		if (rejectedChecks.length > 0) {
			spinner.fail(chalk.bold('Failed validation: '));

			printReport(reports);
			process.exit(1);
		} else {
			spinner.succeed(chalk.bold('Extension is valid'));
		}
	} catch (error) {
		spinner.fail(chalk.bold('Failed validation: '));
		log(String(error), 'error');
	}

	if (options.verbose ?? false) {
		printReport(reports);
	}
}
