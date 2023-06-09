import type { ReadItemsInput, ReadItemsOutput } from './commands/read-items.js';
import type { Command } from './types/index.js';

export interface DirectusClientConfig {
	url: string;
	token?: string;
}

export interface GenericClient<Schema extends object, Features extends object> {
	config: DirectusClientConfig;
	exec: <InputType extends InputTypes, OutputType extends OutputTypes>(
		command: Command<InputType, OutputType, DirectusClient, Schema>
	) => Promise<OutputType>;
	use: <G extends Features>(
		feature: (client: DirectusClient<Schema, Features>) => DirectusClient<Schema, G>
	) => DirectusClient<Schema, G>;
}

// idk just a better name xD
export type BaseClient = Record<string, never>;

export type DirectusClient<
	Schema extends object = any,
	Features extends object = BaseClient
> = GenericClient<Schema, Features> & Features;

//  {
// 	config: Config;
// 	exec: <InputType extends InputTypes, OutputType extends OutputTypes>(
// 		command: Command<InputType, OutputType, DirectusClient, Schema>
// 	) => Promise<OutputType>;
// 	use: <G>(
// 		feature: (client: DirectusClient<Schema, _Features>) => DirectusClient<Schema, G>
// 	) => DirectusClient<Schema, G>;
// } & _Features

type InputTypes = ReadItemsInput<any>;
type OutputTypes = ReadItemsOutput<any, any>;

export const useDirectus = <Schema extends object>(config: DirectusClientConfig) => {
	const exec: DirectusClient<Schema>['exec'] = async (command) => {
		return await command(client);
	};

	const use: DirectusClient<Schema>['use'] = (callback) => {
		return callback(client);
	};

	const client: DirectusClient<Schema> = { config, exec, use };

	return client;
};
