import chalk from 'chalk';
import redent from 'redent';

import { header } from '../core/utils';

//import { command } from './core/command';
import { GluegunCommand } from 'gluegun';

import { Runtime } from 'gluegun/build/types/runtime/runtime';
import { IOutput, OutputColumn } from '../output';

import { Command } from '../command';
import { CommandHelp, GeneralHelp, IHelp, OptionHelp } from '../help';
import { IOptions, Option } from '../options';

import highlight from 'cli-highlight';
import { DefaultTheme } from './output/formats/json';

type Suggestion = {
	name: string;
	words: string[];
};

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

	async suggest(words: string[]): Promise<{ suggestion: string; score: number }[]> {
		if (!words) {
			return [];
		}

		if (!Array.isArray(words)) {
			words = [words];
		}

		if (words.length == 0) {
			return [];
		}

		// Clone
		words = [...words];

		const suggestions = this.runtime.commands!.reduce((commands, command) => {
			const name = (command.name ? command.commandPath!.slice(0, -1).concat(command.name) : command.commandPath!).join(
				' '
			);
			const cmd = command as any as Command;
			const hidden = cmd.run.$directus.settings?.hidden ?? false;
			if (hidden) {
				return commands;
			}

			let hints = cmd.run.$directus.settings?.hints || [];
			if (!Array.isArray(hints)) {
				hints = [hints];
			}

			hints = [name, ...hints];

			return [
				...commands,
				...hints.map((command) => ({
					name,
					words: command.split(' ').map((part) => part.trim()),
				})),
			];
		}, [] as Suggestion[]);

		const jaro = require('jaro-winkler') as (a: string, b: string) => number;
		const sort = (
			words: string[],
			suggestions: (Suggestion & { scores: number[] })[],
			index = 0
		): (Suggestion & { scores: number[] })[] => {
			if (words.length <= 0) {
				return suggestions;
			}
			const [currentWord, ...otherWords] = words;
			return sort(
				otherWords,
				suggestions.map((suggestion) => {
					const scores = [...suggestion.scores];
					if (suggestion.words.length > index) {
						scores.push(jaro(currentWord!, suggestion.words[index]!));
					}
					return {
						...suggestion,
						scores,
					};
				}),
				index + 1
			);
		};

		return sort(
			words,
			suggestions.map((suggestion) => ({
				...suggestion,
				scores: [],
			}))
		)
			.map((suggestion) => {
				let score = suggestion.scores.reduce((a, b) => a + b, 0);
				if (suggestion.scores.length) {
					score = score / suggestion.scores.length;
				}
				return {
					...suggestion,
					score,
				};
			})
			.sort((a, b) => {
				return a.score - b.score;
			})
			.filter((suggestion, index, array) => {
				return !array.find((other, index2) => suggestion.name == other.name && index2 > index);
			})
			.reverse()
			.map((suggestion) => {
				return {
					suggestion: suggestion.name,
					score: suggestion.score,
				};
			});
	}

	async getHelp(): Promise<GeneralHelp> {
		const data: GeneralHelp = {
			description: `Directus CLI version ${require(`${__dirname}/../../package.json`).version}`,
			synopsis: `${this.entrypoint} <command> [options]`,
			commands: this.runtime
				.commands!.reduce(
					(commands, command) => {
						const name = (
							command.name ? command.commandPath!.slice(0, -1).concat(command.name) : command.commandPath!
						).join(' ');
						const cmd = command as any as Command;
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

	async displayHelp(): Promise<GeneralHelp> {
		const help = await this.getHelp();

		await this.output.help(help);
		await this.output.compose(async (ui) => {
			await ui.line(chalk.green(header()));
			await ui.skip();
			await ui.section('Description', (builder) => builder.line(help.description));
			await ui.section('Synopsis', (builder) => builder.line(help.synopsis));
			await ui.section('Commands', async (builder) => {
				await builder.line('These are all the commands you can use to manage your project or installation');
				await builder.skip();

				const groups = new Set(help.commands.map((cmd) => cmd.group));
				for (const group of groups) {
					const commands = help.commands.filter((cmd) => cmd.group === group && !cmd.hidden);
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

			await ui.section('Options', (builder) =>
				builder.table([
					...help.options.map((option) => [`--${option.name}`, chalk.italic(option.type), option.description]),
				])
			);
		});

		return help;
	}

	async getCommandHelp(command: Command): Promise<CommandHelp> {
		const settings = command.run.$directus?.settings;
		const gluegun = command as any as GluegunCommand;
		const synopsis =
			settings.synopsis ||
			[this.entrypoint, ...(gluegun.commandPath || []), settings?.parameters ?? '', '[options]']
				.filter((p) => p != '')
				.join(' ');
		const description = settings.description ?? 'Description unavailable';
		const documentation = settings.documentation ?? 'Documentation unavailable';
		const usage = settings.usage ?? 'Usage information unavailable';

		const opts = this.options.list().sort((a, b) => a.name.localeCompare(b.name));
		const mapOption = (opt: Option): OptionHelp => ({
			name: opt.name,
			group: undefined,
			description: opt.description ?? 'Description unavailable',
			required: opt.required,
			choices: opt.choices,
			default: opt.default,
			type: opt.type,
		});

		const options = opts.filter((opt) => !opt.positional).map(mapOption);
		const positional = opts.filter((opt) => opt.positional).map(mapOption);

		const variables = (text: string) => text.replace(/\$0/g, this.entrypoint);

		return {
			usage: variables(redent(usage)),
			synopsis: variables(redent(synopsis)),
			description: variables(redent(description)),
			documentation: variables(redent(documentation)),
			options: options,
			positional: positional,
		};
	}

	async displayCommandHelp(command: Command): Promise<CommandHelp> {
		const help = await this.getCommandHelp(command);

		await this.output.help(help);
		await this.output.compose(async (ui) => {
			await ui.skip();
			await ui.section('Description', (ui) => ui.line(help.description));
			await ui.section('Synopsis', (ui) => ui.line(help.synopsis));
			await ui.section('Usage', (ui) => ui.text(ui.markdown(help.usage)));
			await ui.section('Documentation', (ui) => ui.text(ui.markdown(help.documentation)));

			const makeOption = (prefix: string, option: OptionHelp): OutputColumn[][] => {
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
							text: option.required ? chalk.bold(`${prefix}${option.name}`) : `${prefix}${option.name}`,
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
							text: ui.markdown(option.description) ?? 'Description unavailable',
							options: {
								padding: [1, 2, 1, 2],
							},
						},
					],
				];
			};

			await ui.section('Positional', async (ui) => {
				if (help.positional.length <= 0) {
					await ui.line('No positional options available');
					return;
				}

				await ui.rows([
					...help.positional
						.filter((o) => o.required)
						.map(makeOption.bind(this, '\xA0\xA0'))
						.reduce((prev, curr) => [...prev, ...curr], []),
					...help.positional
						.filter((o) => !o.required)
						.map(makeOption.bind(this, '\xA0\xA0'))
						.reduce((prev, curr) => [...prev, ...curr], []),
				]);
			});

			await ui.section('Options', async (ui) => {
				if (help.options.length <= 0) {
					await ui.line('No options available');
					return;
				}

				await ui.rows([
					...help.options
						.filter((o) => o.required)
						.map(makeOption.bind(this, '--'))
						.reduce((prev, curr) => [...prev, ...curr], []),
					...help.options
						.filter((o) => !o.required)
						.map(makeOption.bind(this, '--'))
						.reduce((prev, curr) => [...prev, ...curr], []),
				]);
			});
		});

		return help;
	}
}
