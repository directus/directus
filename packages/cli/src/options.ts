import { Argv } from 'yargs';
import { Command } from './command';

export type Registrator = (builder: Argv, command: Command, unparsed: any) => void;

export type Option = {
	name: string;
	description?: string;
	type: string;
	choices?: string[];
	required: boolean;
	default?: any;
};

export interface IOptions {
	feature(name: string, registrator: Registrator): void;
	register(registrator: Registrator): void;
	failed(): boolean;
	error(): Error | undefined;
	values<T = any>(): T;
	list(): Option[];
}
