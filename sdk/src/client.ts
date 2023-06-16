export interface ClientConfig {
	token?: string;
}

export interface DirectusClient<Schema extends object> {
	config: { url: URL };
	auth: { token: string | null };
	use: <TExtension extends object>(
		createExtension: (client: DirectusClient<Schema>) => TExtension
	) => this & TExtension;
}

export const useDirectus = <Schema extends object = any>(url: string, config?: ClientConfig) => {
	const client: DirectusClient<Schema> = {
		config: {
			url: new URL(url),
		},
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
