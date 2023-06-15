import type { AuthStorage } from '../composables/authentication.js';

export interface ClientConfig {
	token?: string;
}

export interface DirectusClient<Schema extends object = any, Features extends object = Record<string, never>> {
	config: { url: URL };
	auth: AuthStorage;

	use: <ExtraFeatures extends object>(
		feature: (client: DirectusClient<Schema, Features>) => ExtraFeatures
	) => DirectusClient<Schema, Features & ExtraFeatures>;
}
