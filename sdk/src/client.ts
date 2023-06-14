import { WebSocket } from 'ws';
import type { AuthStorage } from './composables/authentication.js';
import { withoutTrailingSlash } from './utils.js';
// import type { ReadItemsInput, ReadItemsOutput } from './commands/read-items.js';
// import type { Command } from './types/index.js';

export interface ClientConfig {
	fetch?: fetch;
	ws?: typeof WebSocket;
	url?: string;
	token?: string;
}

export interface BaseClientConfig extends Record<string, any> {
	fetch: fetch;
	ws: typeof WebSocket;
	apiURL: string;
}

export interface GenericClient<Schema extends object, Features extends object> {
	config: BaseClientConfig;
	auth: AuthStorage;

	use: <ExtraFeatures extends object>(
		feature: (client: DirectusClient<Schema, Features>) => ExtraFeatures
	) => DirectusClient<Schema, Features & ExtraFeatures>;
}

// idk just a better type hint name xD
export type BaseClient = Record<string, never>;

// sometimes you know better than prettier
// eslint-disable-next-line prettier/prettier
export type DirectusClient<
	Schema extends object = any,
	Features extends object = BaseClient
> = GenericClient<Schema, Features> & Features;

// type InputTypes = ReadItemsInput<any>;
// type OutputTypes = ReadItemsOutput<any, any>;

export const useDirectus = <Schema extends object>(config: ClientConfig = {}) => {
	// return a bare bones client
	return {
		config: {
			fetch: config.fetch ?? fetch,
			ws: config.ws ?? WebSocket,
			apiURL: config.url ? withoutTrailingSlash(config.url) : '',
		},
		auth: {
			access_token: config.token,
		},
		use(feature) {
			const extra = feature(this);
			return extendClient(this, extra);
		},
	} as DirectusClient<Schema, BaseClient>;
};

export function extendClient<Schema extends object, Features extends object, ExtraFeatures extends object>(
	client: DirectusClient<Schema, Features>,
	properties: ExtraFeatures
): DirectusClient<Schema, Features & ExtraFeatures> {
	const partialClient = client as Partial<Features & ExtraFeatures>;
	const getKeys = <T extends object>(obj: T) => Object.keys(obj) as (keyof T)[];

	getKeys(properties).forEach((key) => {
		if (key === 'config') {
			partialClient[key] = {
				...partialClient[key],
				...properties[key],
			} as (Features & ExtraFeatures)[keyof ExtraFeatures];
		} else {
			partialClient[key] = properties[key] as (Features & ExtraFeatures)[keyof ExtraFeatures];
		}
	});

	return partialClient as DirectusClient<Schema, Features & ExtraFeatures>;
}
