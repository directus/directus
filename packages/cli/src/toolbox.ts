import { IDirectus, QueryMany, QueryOne, TypeMap } from '@directus/sdk';
import { Command } from './command';
import { IOptions } from './options';
import { IEvents } from './events';
import { IOutput } from './output';
import { IHelp } from './help';
import { IConfiguration, IStaticConfiguration, SystemConfiguration, ProjectConfiguration } from './config';

export type Toolbox<T extends TypeMap = TypeMap> = {
	command: Command;
	help: IHelp;
	options: IOptions;
	events: IEvents;
	sdk: IDirectus<T>;
	output: IOutput;
	config: {
		system: IConfiguration<SystemConfiguration>;
		project: IStaticConfiguration<ProjectConfiguration>;
	};
	result?: any;
	query: {
		one: QueryOne<unknown>;
		many: QueryMany<unknown>;
	};
	stdin?: any;
	[extension: string]: any | undefined;
};
