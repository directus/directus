import type { Query } from '@directus/types';
// import type { DirectusClient } from '../client.js';
import type { WebSocketClient } from '../decorators/index.js';
import type { Command } from '../types/index.js';
import { serializeParams } from '../utils.js';

export interface SubscribeInput<Schema extends object> {
	collection: keyof Schema;
	event?: 'create' | 'update' | 'delete';
	query?: Query;
	uid?: string;
}

export type SubscribeOutput<
	Schema extends object,
	Input extends SubscribeInput<Schema>
> = Schema[Input['collection']][];

export const subscribe = <Schema extends object = any, Input extends SubscribeInput<Schema> = any>(
	input: Input
): Command<SubscribeInput<Schema>, SubscribeOutput<Schema, Input>, WebSocketClient<Schema>, Schema> => {
	return async (client) => {
        
		return {} as SubscribeOutput<Schema, Input>;
	};
};
