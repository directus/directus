import { Command } from './command';

export type OptionHelp = {
	name: string;
	type: string;
	choices?: string[];
	group?: string;
	description: string;
	required: boolean;
	default: any;
};

export type GeneralHelp = {
	description: string;
	synopsis: string;
	commands: {
		name: string;
		description: string;
		hidden: boolean;
		group: string;
	}[];
	options: {
		name: string;
		type: string;
		default: any;
		description: string;
	}[];
};

export type CommandHelp = {
	description: string;
	synopsis: string;
	documentation: string;
	usage: string;
	options: OptionHelp[];
};

export interface IHelp {
	getHelp(): Promise<GeneralHelp>;
	getCommandHelp(command: Command): Promise<CommandHelp>;
	displayHelp(): Promise<GeneralHelp>;
	displayCommandHelp(command: Command): Promise<CommandHelp>;
}
