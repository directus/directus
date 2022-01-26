import { Toolbox } from '../toolbox';
import { Command, CommandResult, Handler, Settings } from '../command';
import { defaults } from './utils';
import { CLIError, CLIRuntimeError } from './exceptions';

export function command<T extends Toolbox = Toolbox, P = any, R = void>(
	settings: Settings<P>,
	execute: Handler<T, P, R>
): Command<T> {
	settings = defaults(settings, {
		hidden: false,
		usage: 'No usage information available',
		description: 'No command description available',
		features: {
			output: true,
		},
	});

	const run = async function (toolbox: T): Promise<CommandResult<R>> {
		const { command, options, events, output, help } = toolbox;

		command.settings = command.run.$directus.settings;

		let opts: any = {};

		const handleError = async (error: CLIError) => {
			await output.error(error);

			let helpData = undefined;
			if (error instanceof CLIRuntimeError) {
				if (!settings.disableHelp) {
					helpData = await help.displayCommandHelp(command);
				}
				return {
					help: helpData,
					error,
				};
			}

			if (!settings.disableHelp) {
				helpData = await help.getCommandHelp(command);
			}

			return {
				help: helpData,
				error,
			};
		};

		try {
			await events.emit('command.initialize.before', command);
			await events.emit('output.formats.register', output);

			options.register((registrator) => {
				if (settings.options) {
					registrator = settings.options(registrator);
				}
				registrator.option('help', {
					type: 'boolean',
					default: false,
					description: 'Show help',
				});
			});

			await events.emit('command.options.register', command);
			await events.emit('command.initialize.after', command);

			opts = options.values();
			if (options.failed() && !opts.help) {
				return await handleError(options.error()!);
			}

			if (opts.help && !settings.disableHelp) {
				return {
					help: await help.displayCommandHelp(command),
				};
			}
		} catch (error: any) {
			return await handleError(error);
		}

		try {
			await events.emit('command.execute.before', command, opts);
			const result = await execute(toolbox, opts);
			await output.value(result);
			await events.emit('command.execute.after', command);

			let helpData = undefined;
			if (!settings.disableHelp) {
				helpData = await help.getCommandHelp(command);
			}

			return {
				result: result,
				help: helpData,
			};
		} catch (error: any) {
			return await handleError(error);
		}
	};

	run.$directus = {
		settings,
	};

	return {
		hidden: settings.hidden,
		description: settings.description,
		run,
	} as Command<T>;
}
