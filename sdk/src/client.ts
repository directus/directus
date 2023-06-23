export interface ClientConfig {
	token?: string;
}

export interface DirectusClient<Schema extends object> {
	url: URL;
	token: string | null;
	use: <Extension extends object>(createExtension: (client: DirectusClient<Schema>) => Extension) => this & Extension;
}

/**
 * Creates a client to communicate with a Directus app.
 *
 * @param url The URL to the Directus app.
 * @param config The optional configuration.
 *
 * @returns A Directus client.
 */
export const useDirectus = <Schema extends object = any>(
	url: string,
	config?: ClientConfig
): DirectusClient<Schema> => {
	return {
		url: new URL(url),
		token: config?.token ?? null,
		use(createExtension) {
			return {
				...this,
				...createExtension(this),
			};
		},
	};
};
