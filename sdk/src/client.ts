export interface ClientConfig {
	token?: string;
}

export interface DirectusClient<Schema extends object> {
	url: URL;
	auth: { token: string | null };
	use: <Extension extends object>(createExtension: (client: DirectusClient<Schema>) => Extension) => this & Extension;
}

export const useDirectus = <Schema extends object = any>(url: string, config?: ClientConfig) => {
	const client: DirectusClient<Schema> = {
		url: new URL(url),
		auth: {
			token: config?.token ?? null,
		},
		use(createExtension) {
			const extension = createExtension(this);

			return {
				...this,
				...extension,
			};
		},
	};

	return client;
};
