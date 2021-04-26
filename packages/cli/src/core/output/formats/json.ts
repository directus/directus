import chalk from 'chalk';
import { tty } from '../../utils';

import highlight, { Theme, DEFAULT_THEME } from 'cli-highlight';
import { Argv } from 'yargs';
import { FormatData, IOutputFormat } from '../../../output';

export type JsonOutputFormatOptions = {
	pretty: boolean;
	highlight: boolean;
};

export const DefaultTheme: Theme = {
	...DEFAULT_THEME,
	string: chalk.reset.reset,
};

export class JsonOutputFormat implements IOutputFormat<JsonOutputFormatOptions> {
	private theme: Theme;

	constructor(theme: Theme = DefaultTheme) {
		this.theme = theme;
	}

	registerOptions(options: Argv) {
		return options
			.option('highlight', {
				type: 'boolean',
				default: tty,
				description: 'Whether or not to highlight the output',
				implies: ['pretty'],
			})
			.option('pretty', {
				type: 'boolean',
				default: tty,
				description: 'Whether or not to format the output',
			});
	}

	async value<T>(value: T, options: JsonOutputFormatOptions): Promise<string> {
		let formatted = JSON.stringify(value, null, options.pretty || options.highlight ? 2 : 0) ?? 'undefined';
		if (options.highlight) {
			formatted = highlight(formatted, {
				ignoreIllegals: true,
				language: 'json',
				theme: this.theme,
			});
		}
		return formatted;
	}

	async format(data: FormatData, options: JsonOutputFormatOptions): Promise<string> {
		return await this.value(data.data, options);
	}
}
