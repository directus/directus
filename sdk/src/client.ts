export interface ClientConfig {
	token?: string;
}

export interface DirectusClient<Schema extends object> {
	url: URL;
	getToken: () => Promise<string | null>;
	setToken: (token: string | null) => void;
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
	let token = config?.token ?? null;
	return {
		url: new URL(url),
		getToken: async () => token,
		setToken: (newToken) => (token = newToken),
		use(createExtension) {
			return {
				...this,
				...createExtension(this),
			};
		},
	};
};
