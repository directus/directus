import type { PrimaryKey } from '@directus/types';
import type { ApplyQueryFields, Query } from '../types/query.js';

export type WebSocketAuthModes = 'public' | 'handshake' | 'strict';

export interface WebSocketConfig {
	authMode?: WebSocketAuthModes;
	reconnect?: boolean;
	url?: string;
}

export interface SubscribeOptions<Schema extends object, Collection extends keyof Schema> {
	event?: SubscriptionOptionsEvents;
	query?: Query<Schema, Schema[Collection]>;
	uid?: string;
}

export interface WebSocketClient<Schema extends object> {
	connect(): Promise<void>;
	disconnect(): void;
	message(message: Record<string, any>): void;
	receive(callback: (message: Record<string, any>) => any): () => void;
	subscribe<Collection extends keyof Schema, Options extends SubscribeOptions<Schema, Collection>>(
		collection: Collection,
		options?: Options
	): Promise<{
		subscription: AsyncGenerator<
			SubscriptionOutput<
				Schema,
				Collection,
				Options['query'],
				Fallback<Options['event'], SubscriptionOptionsEvents> | 'init'
			>,
			void,
			unknown
		>;
		unsubscribe(): void;
	}>;
}

type Fallback<Selected, Options> = Selected extends Options ? Selected : Options;
export type SubscriptionOptionsEvents = 'create' | 'update' | 'delete';
export type SubscriptionEvents = 'init' | SubscriptionOptionsEvents;

export type SubscriptionOutput<
	Schema extends object,
	Collection extends keyof Schema,
	TQuery extends Query<Schema, Schema[Collection]> | undefined,
	Events extends SubscriptionEvents,
	TItem = TQuery extends Query<Schema, Schema[Collection]>
		? ApplyQueryFields<Schema, Schema[Collection], TQuery['fields']>
		: Partial<Schema[Collection]>
> = { type: 'subscription' } & {
	[Event in Events]: SubscriptionPayload<TItem>[Event];
}[Events];

type SubscriptionPayload<Item> = {
	init: Item[];
	create: Item[];
	update: Item[];
	delete: PrimaryKey[];
};
