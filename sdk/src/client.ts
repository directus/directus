export interface ClientConfig {
	token?: string;
}

export interface DirectusClient<TSchema extends object> {
	url: URL;
	auth: { token: string | null };
	use: <TExtension extends object>(
		createExtension: (client: DirectusClient<TSchema>) => TExtension
	) => this & TExtension;
}

export const useDirectus = <TSchema extends object = any>(url: string, config?: ClientConfig) => {
	const client: DirectusClient<TSchema> = {
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
