import type { ReadItemsInput, ReadItemsOutput } from './commands/read-items.js';
import type { Command } from './types/index.js';

export interface DirectusClientConfig {
	url: string;
	token?: string;
}

export interface DirectusClient<Schema extends object = any> {
	config: DirectusClientConfig;
	exec: <InputType extends InputTypes, OutputType extends OutputTypes>(
		command: Command<InputType, OutputType, DirectusClient, Schema>
	) => Promise<OutputType>;
}

type InputTypes = ReadItemsInput<any>;
type OutputTypes = ReadItemsOutput<any, any>;

export const useDirectus = <Schema extends object = any>(config: DirectusClientConfig) => {
	const exec: DirectusClient<Schema>['exec'] = async (command) => {
		return await command(client);
	};

	const client: DirectusClient<Schema> = { config, exec };

	return client;
};
