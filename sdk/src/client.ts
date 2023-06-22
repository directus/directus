export interface ClientConfig {
	token?: string;
}

export interface DirectusClient<Schema extends object> {
	url: URL;
	auth: { token: string | null };
	use: <Extension extends object>(createExtension: (client: DirectusClient<Schema>) => Extension) => this & Extension;
}

export const useDirectus = <Schema extends object = any>(url: string | URL, config?: ClientConfig) => {
	const client: DirectusClient<Schema> = {
		url: typeof url === 'string' ? new URL(url) : url,
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
