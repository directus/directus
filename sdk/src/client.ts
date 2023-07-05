// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ClientConfig {
	//token?: string;
}

export interface DirectusClient<Schema extends object> {
	url: URL;
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
	_config?: ClientConfig
): DirectusClient<Schema> => {
	return {
		url: new URL(url),
		use(createExtension) {
			return {
				...this,
				...createExtension(this),
			};
		},
	};
};
