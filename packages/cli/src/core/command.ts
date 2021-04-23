import { Toolbox } from '../toolbox';
import { Command, Handler, Settings } from '../command';
import { defaults } from './utils';
import { CLIRuntimeError } from './exceptions';

export function command<T extends Toolbox = Toolbox, P = any>(
	settings: Settings<P>,
	execute: Handler<T, P>
): Command<T> {
	settings = defaults(settings, {
		features: {
			output: true,
		},
	});

	const run = async function (toolbox: T) {
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
			if ((opts.help && !settings.disableHelp) || options.failed()) {
				await help.displayCommandHelp(command);
				if (options.failed() && !opts.help) {
					throw options.error();
				}
				return;
			}
		} catch (error) {
			if (error instanceof CLIRuntimeError) {
				await help.displayCommandHelp(command, error);
			} else {
				await output.writeError(error);
			}
			return {
				error,
			};
		}

		try {
			await events.emit('command.execute.before', command);
			const value = await execute(toolbox, opts);
			await events.emit('command.execute.after', command);
			return {
				value,
			};
		} catch (error) {
			if (error instanceof CLIRuntimeError) {
				await help.displayCommandHelp(command, error);
			} else {
				await output.writeError(error);
			}
			return {
				error,
			};
		}
	};

	run.$directus = {
		settings,
	};

	return {
		hidden: settings.hidden ?? false,
		description: settings.description ?? 'No command description provided',
		run,
	} as Command<T>;
}
