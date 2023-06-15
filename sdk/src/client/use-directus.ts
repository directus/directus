import { extendClient } from './extend-client.js';
import type { ClientConfig, DirectusClient } from './types.js';

export const useDirectus = <Schema extends object>(url: string, config?: ClientConfig) => {
	return {
		config: {
			url: new URL(url),
		},
		auth: {
			access_token: config?.token,
		},
		use(feature) {
			const extra = feature(this);
			return extendClient(this, extra);
		},
	} as DirectusClient<Schema>;
};
