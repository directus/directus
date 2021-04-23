import chalk from 'chalk';
import stripAnsi from 'strip-ansi';
import title from '@directus/format-title';

import { Argv } from 'yargs';
import { IOutputFormat, TableStyle } from '../../../output';
import { DefaultIndentSize, FullTerminalWidth, OutputBuilder } from '../builder';
import { JsonOutputFormat } from './json';
import { CLIError } from '../../exceptions';

export type HumanOutputFormatOptions = {
	ansi: boolean;
	table: string | 'minimal' | 'compact' | 'markdown';
	stacktrace: boolean;
};

export class HumanOutputFormat implements IOutputFormat<HumanOutputFormatOptions> {
	private json: JsonOutputFormat;

	constructor() {
		this.json = new JsonOutputFormat();
	}

	registerOptions(options: Argv) {
		return options
			.option('ansi', {
				type: 'boolean',
				default: true,
				description: 'Whether or not to output ansi codes',
			})
			.option('stacktrace', {
				type: 'boolean',
				default: process.env.DEBUG ? true : false,
				description: 'Display extended information on error',
			})
			.option('table', {
				type: 'string',
				choices: ['minimal', 'compact', 'markdown'],
				default: 'compact',
				description: 'The table layout to use when displaying data',
			});
	}

	async formatText<T>(text: string, _value: T | undefined, options: HumanOutputFormatOptions): Promise<string> {
		if (!options.ansi) {
			text = stripAnsi(text);
		}
		return text;
	}

	async formatValue<T>(value: T, options: HumanOutputFormatOptions): Promise<string> {
		if (Array.isArray(value)) {
			return await this.formatMany(value, options);
		}

		const fields = Object.keys(value).sort();

		const val = value as Record<string, any>;

		const builder = new OutputBuilder(DefaultIndentSize, FullTerminalWidth);
		await builder.table(
			await Promise.all(
				fields.map(async (field) => {
					return [
						field,
						await this.json.formatValue(val[field], {
							highlight: true,
							pretty: true,
						}),
					];
				})
			),
			{
				head: ['Property', 'Value'],
				alignments: ['right', 'left'],
				style: options.table as TableStyle,
			}
		);

		return this.formatText(await builder.get(), undefined, options);
	}

	async formatMany<T>(values: T[], options: HumanOutputFormatOptions): Promise<string> {
		const builder = new OutputBuilder(DefaultIndentSize, FullTerminalWidth);

		if (values.length <= 0) {
			await builder.table([], {
				style: options.table as TableStyle,
			});
			return await builder.get();
		}

		const fields = Object.keys(values[0]!).sort();

		await builder.wrap(
			async (builder) =>
				await builder.table(
					await Promise.all(
						values.map((row: T) =>
							Promise.all(
								fields.map((field) =>
									this.json.formatValue((row as any)[field], {
										highlight: true,
										pretty: true,
									})
								)
							)
						)
					),
					{
						head: fields,
						headFormat: (v) => chalk.reset.bold(title(v)),
						style: options.table as TableStyle,
						wrap: true,
					}
				),
			1
		);

		return this.formatText(await builder.get(), undefined, options);
	}

	async formatError(err: CLIError, options: HumanOutputFormatOptions): Promise<string> {
		const builder = new OutputBuilder(2, FullTerminalWidth);
		await builder.error(err, {
			stacktrace: options.stacktrace,
		});

		return await this.formatText(await builder.get(), { err }, options);
	}
}
