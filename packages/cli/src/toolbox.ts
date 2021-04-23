import { IDirectus } from '@directus/sdk';
import { TypeMap } from '@directus/sdk/dist/types';
import { Command } from './command';
import { IOptions } from './options';
import { IEvents } from './events';
import { IOutput } from './output';
import { IHelp } from './help';
import { IConfiguration, IStaticConfiguration, SystemConfiguration, ProjectConfiguration } from './config';

export type Toolbox<T extends TypeMap = {}> = {
	command: Command;
	help: IHelp;
	options: IOptions;
	events: IEvents;
	instance: IDirectus<T>;
	output: IOutput;
	config: {
		system: IConfiguration<SystemConfiguration>;
		project: IStaticConfiguration<ProjectConfiguration>;
	};
	result?: any;
	[extension: string]: any | undefined;
};
