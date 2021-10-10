import { Argv } from 'yargs';
import { CLIError } from './core/exceptions';
import { StdinFeatures } from './core/extensions/stdin';
import { CommandHelp, GeneralHelp } from './help';
import { IOutput } from './output';
import { Toolbox } from './toolbox';

export type Features = {
	sdk?: boolean;
	query?: 'one' | 'many';
	output?: boolean;
	stdin?: StdinFeatures;
	[feature: string]: unknown;
};

export type Settings<P = unknown> = {
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
	hints?: string[];
	options?(builder: Argv): Argv<P>;
};

export type Handler<T extends Toolbox = Toolbox, P = unknown, R extends any = void> = (
	toolbox: T,
	params: P
) => Promise<R>;

export type CommandResult<T extends any> = {
	result?: T;
	help?: GeneralHelp | CommandHelp;
	error?: CLIError;
	output?: IOutput;
};

export type Command<T extends Toolbox = Toolbox, P = unknown, R extends any = void> = {
	settings?: Settings<P>;
	run: {
		/**
		 * @note Please don't access this field. It's for internal use only and a workaround for Gluegun.
		 */
		$directus: {
			settings: Settings<P>;
		};
		(toolbox: T): R | Promise<CommandResult<R>>;
	};
};
