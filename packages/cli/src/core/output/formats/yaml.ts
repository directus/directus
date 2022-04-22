import chalk from 'chalk';
import yaml from 'js-yaml';
import { tty } from '../../utils';

import highlight, { Theme, DEFAULT_THEME } from 'cli-highlight';
import { Argv } from 'yargs';
import { FormatData, IOutputFormat } from '../../../output';

export type YamlOutputFormatOptions = {
	pretty: boolean;
	highlight: boolean;
};

export const DefaultTheme: Theme = {
	...DEFAULT_THEME,
	string: chalk.reset.rgb(234, 118, 116),
};

export class YamlOutputFormat implements IOutputFormat<YamlOutputFormatOptions> {
	private theme: Theme;

	constructor(theme: Theme = DefaultTheme) {
		this.theme = theme;
	}

	registerOptions(options: Argv): Argv<YamlOutputFormatOptions> {
		return options
			.option('highlight', {
				type: 'boolean',
				default: tty,
				description: 'Whether or not to highlight the output',
			})
			.option('pretty', {
				type: 'boolean',
				default: tty,
				description: 'Whether or not to format the output',
			});
	}

	async value<T>(value: T, options: YamlOutputFormatOptions): Promise<string> {
		let formatted = yaml.dump(value, {
			condenseFlow: !options.pretty,
			forceQuotes: !options.pretty,
			indent: 2,
		});
		if (options.highlight) {
			formatted = highlight(formatted, {
				ignoreIllegals: true,
				language: 'yaml',
				theme: this.theme,
			});
		}
		return formatted;
	}

	async format(data: FormatData, options: YamlOutputFormatOptions): Promise<string> {
		return await this.value(data.value, options);
	}
}
