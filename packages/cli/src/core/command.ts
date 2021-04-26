import { Toolbox } from '../toolbox';
import { Command, CommandResult, Handler, Settings } from '../command';
import { defaults } from './utils';
import { CLIRuntimeError } from './exceptions';

export function command<T extends Toolbox = Toolbox, P = any, R extends any = void>(
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
			if (options.failed()) {
				const error = options.error()!;
				await output.error(error);
				if (error instanceof CLIRuntimeError) {
					return {
						help: await help.displayCommandHelp(command),
						error,
					};
				}
				return {
					help: await help.getCommandHelp(command),
					error,
				};
			}

			if (opts.help && !settings.disableHelp) {
				return {
					help: await help.displayCommandHelp(command),
				};
			}
		} catch (error) {
			await output.error(error);
			if (error instanceof CLIRuntimeError) {
				return {
					help: await help.displayCommandHelp(command),
					error,
				};
			}
			return {
				help: await help.getCommandHelp(command),
				error,
			};
		}

		try {
			await events.emit('command.execute.before', command, opts);
			const data = await execute(toolbox, opts);
			await output.value(data);
			await events.emit('command.execute.after', command);
			return {
				data,
				help: await help.getCommandHelp(command),
			};
		} catch (error) {
			await output.error(error);
			if (error instanceof CLIRuntimeError) {
				return {
					help: await help.displayCommandHelp(command),
					error,
				};
			}
			return {
				help: await help.getCommandHelp(command),
				error,
			};
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
