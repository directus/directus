import chalk from 'chalk';
import stripIndent from 'strip-indent';

import { header } from '../core/utils';

//import { command } from './core/command';
import { GluegunCommand } from 'gluegun';

import { Runtime } from 'gluegun/build/types/runtime/runtime';
import { IOutput, OutputColumn } from '../output';

import { Command } from '../command';
import { CommandHelp, GeneralHelp, IHelp, OptionHelp } from '../help';
import { IOptions } from '../options';

import highlight from 'cli-highlight';
import { DefaultTheme } from './output/formats/json';

export class Help implements IHelp {
	private entrypoint: string;
	private options: IOptions;
	private output: IOutput;
	private runtime: Runtime;

	constructor(entrypoint: string, deps: { /*events: IEvents;*/ output: IOutput; runtime: Runtime; options: IOptions }) {
		//this.events = deps.events;
		this.entrypoint = entrypoint;
		this.output = deps.output;
		this.runtime = deps.runtime;
		this.options = deps.options;
	}

	async getHelp(): Promise<GeneralHelp> {
		const data: GeneralHelp = {
			description: `Directus CLI version ${require(`${__dirname}/../../package.json`).version}`,
			synopsis: `${this.entrypoint} <command> [options]`,
			commands: this.runtime
				.commands!.reduce(
					(commands, command) => {
						const name = (command.name
							? command.commandPath!.slice(0, -1).concat(command.name)
							: command.commandPath!
						).join(' ');
						const cmd = (command as any) as Command;
						const hidden = cmd.run.$directus.settings?.hidden ?? false;
						const group = cmd.run.$directus.settings?.group ?? 'cli';
						const description = cmd.run.$directus.settings?.description || '';
						return [
							...commands,
							{
								name,
								description,
								hidden,
								group,
							},
						];
					},
					[] as {
						name: string;
						description: string;
						hidden: boolean;
						group: string;
					}[]
				)
				.sort((a, b) => a.name.localeCompare(b.name)),
			options: [
				{
					name: 'help',
					type: 'boolean',
					default: 'false',
					description: 'Show help for the specified command',
				},
			],
		};

		return data;
	}

	async displayHelp(error?: Error) {
		const data = await this.getHelp();
		await this.output.build(
			async (builder) => {
				await builder.line(chalk.green(header()));
				await builder.skip();
				await builder.section('Description', (builder) => builder.line(data.description));
				await builder.section('Synopsis', (builder) => builder.line(data.synopsis));
				await builder.section('Commands', async (builder) => {
					await builder.line('These are all the commands you can use to manage your project or installation');
					await builder.skip();

					const groups = new Set(data.commands.map((cmd) => cmd.group));
					for (const group of groups) {
						const commands = data.commands.filter((cmd) => cmd.group === group);
						if (commands.length <= 0) {
							continue;
						}

						await builder.section(group, (builder) =>
							builder.table(
								commands.map((command): [string, string] => {
									return [command.name, command.description];
								})
							)
						);
					}
				});

				await builder.section('Options', (builder) =>
					builder.table([
						...data.options.map((option) => [`--${option.name}`, chalk.italic(option.type), option.description]),
					])
				);

				if (error) {
					await builder.error(error);
				}
			},
			{
				...data,
				error,
			}
		);
	}

	async getCommandHelp(command: Command): Promise<CommandHelp> {
		const settings = command.run.$directus?.settings;
		const gluegun = (command as any) as GluegunCommand;
		const synopsis =
			settings.synopsis ||
			[this.entrypoint, ...(gluegun.commandPath || []), settings?.parameters ?? '', '[options]']
				.filter((p) => p != '')
				.join(' ');
		const description = settings.description ?? 'Description unavailable';
		const documentation = settings.documentation ?? 'Documentation unavailable';
		const usage = settings.usage ?? 'Usage information unavailable';
		const options = this.options
			.list()
			.sort((a, b) => a.name.localeCompare(b.name))
			.map(
				(opt): OptionHelp => ({
					name: opt.name,
					group: undefined,
					description: opt.description ?? 'Description unavailable',
					required: opt.required,
					choices: opt.choices,
					default: opt.default,
					type: opt.type,
				})
			);

		const variables = (text: string) => text.replace(/\$0/g, this.entrypoint);

		return {
			usage: variables(stripIndent(usage)),
			synopsis: variables(stripIndent(synopsis)),
			description: variables(stripIndent(description)),
			documentation: variables(stripIndent(documentation)),
			options: options,
		};
	}

	async displayCommandHelp(command: Command, error?: Error): Promise<void> {
		const data = await this.getCommandHelp(command);

		await this.output.build(
			async (builder) => {
				await builder.skip();
				await builder.section('Description', (builder) => builder.line(data.description));
				await builder.section('Synopsis', (builder) => builder.line(data.synopsis));
				await builder.section('Usage', (builder) => builder.markdown(data.usage));
				await builder.section('Documentation', (builder) => builder.markdown(data.documentation));
				await builder.section('Options', async (builder) => {
					if (data.options.length <= 0) {
						await builder.line('No options available');
						return;
					}

					const makeOption = (option: OptionHelp): OutputColumn[][] => {
						let defaultValue = '';
						if (typeof option.default != 'undefined') {
							defaultValue = `default: ${highlight(JSON.stringify(option.default), {
								language: 'json',
								ignoreIllegals: true,
								theme: DefaultTheme,
							})}`;
						}

						let type = option.type;
						if (option.choices) {
							type = option.choices.join(' | ');
						}

						return [
							[
								{
									text: option.required ? chalk.bold(`--${option.name}`) : `--${option.name}`,
									options: {},
								},
								{
									text: type,
									options: {
										alignment: 'right',
									},
								},
							],
							[
								{
									text: chalk.italic.gray(option.required ? chalk.bold('required') : 'optional'),
									options: {
										padding: [0, 0, 0, 2],
									},
								},
								{
									text: defaultValue,
									options: {
										alignment: 'right',
									},
								},
							],
							[
								{
									text: option.description ?? 'Description unavailable',
									options: {
										padding: [1, 2, 1, 2],
									},
								},
							],
						];
					};

					await builder.rows([
						...data.options
							.filter((o) => o.required)
							.map(makeOption)
							.reduce((prev, curr) => [...prev, ...curr], []),
						...data.options
							.filter((o) => !o.required)
							.map(makeOption)
							.reduce((prev, curr) => [...prev, ...curr], []),
					]);
				});

				if (error) {
					await builder.error(error);
				}
			},
			{
				...data,
				error,
			}
		);
	}
}
