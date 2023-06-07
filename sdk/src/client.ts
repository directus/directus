import type { Command } from './types/command.js';
import type { ReadItemsOutput } from './commands/items/read.js';

export interface DirectusClientConfig {
	url: string;
	token?: string;
}

export const useDirectus = <Schema extends object = any, OutputTypes = ReadItemsOutput>(
	config: DirectusClientConfig
) => {
	const exec = async <OutputType extends OutputTypes>(
		command: Command<OutputType, DirectusClientConfig, Schema>
	): Promise<OutputType> => {
		return await command(config);
	};

	return { exec, config };
};
