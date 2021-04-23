import { Argv } from 'yargs';
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

export type Handler<T extends Toolbox = Toolbox, P = {}> = (toolbox: T, params: P) => Promise<void>;

export type Command<T extends Toolbox = Toolbox, P = {}> = {
	settings?: Settings<P>;
	run: {
		/**
		 * @deprecated Please don't access this field. It's for internal use only and a workaround for Gluegun.
		 */
		$directus: {
			settings: Settings<P>;
		};
		(toolbox: T): void | Promise<void>;
	};
};
