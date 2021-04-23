import { Argv } from 'yargs';
import { CLIError } from './core/exceptions';
import { IOutput } from './output';
import { Toolbox } from './toolbox';

export type Features = {
	query?: boolean;
	output?: boolean;
	[feature: string]: unknown;
};

export type Settings<P = {}> = {
	description?: string;
	parameters?: string;
	group?: string;
	synopsis?: string;
	documentation?: string;
	configuration?: string;
	usage?: string;
	features?: Features;
	disableHelp?: boolean;
	hidden?: boolean;
	options?(builder: Argv): Argv<P>;
};

export type Handler<T extends Toolbox = Toolbox, P = {}, R extends any = void> = (toolbox: T, params: P) => Promise<R>;

export type CommandResult<T extends any> = {
	error?: CLIError;
	output?: IOutput;
	result?: T;
};

export type Command<T extends Toolbox = Toolbox, P = {}, R extends any = void> = {
	settings?: Settings<P>;
	run: {
		/**
		 * @deprecated Please don't access this field. It's for internal use only and a workaround for Gluegun.
		 */
		$directus: {
			settings: Settings<P>;
		};
		(toolbox: T): R | Promise<CommandResult<R>>;
	};
};
