import type { ReadItemsInput, ReadItemsOutput } from './commands/items/read.js';
import type { Command } from './types.js';

export interface DirectusClientConfig {
	url: string;
	token?: string;
}

export const useDirectus = <Schema extends object = any>(config: DirectusClientConfig) => {
	type InputTypes = ReadItemsInput<Schema>;
	type OutputTypes = ReadItemsOutput;

	const exec = async <InputType extends InputTypes, OutputType extends OutputTypes>(
		command: Command<InputType, OutputType, DirectusClientConfig, Schema>
	): Promise<OutputType> => {
		return await command(config);
	};

	return { exec };
};
