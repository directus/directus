import type { ReadItemsInput, ReadItemsOutput } from './commands/read-items.js';
import type { Command } from './types/index.js';

export interface DirectusClientConfig {
	url: string;
	token?: string;
}

export interface DirectusClient<Schema extends object = any, _Features = null> {
	config: DirectusClientConfig;
	exec: <InputType extends InputTypes, OutputType extends OutputTypes>(
		command: Command<InputType, OutputType, DirectusClient, Schema>
	) => Promise<OutputType>;
	use: <G>(
		feature: (client: DirectusClient<Schema, _Features>) => DirectusClient<Schema, G>
	) => DirectusClient<Schema, G>;
}

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
