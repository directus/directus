export type BaseClient = {};

export interface ClientConfig {
	token?: string;
}

export interface DirectusClient<_TSchema = any> extends BaseClient {
	config: { url: URL };
	auth: { token: string | null };
	use: <TExtension extends object>(createExtension: (client: this) => TExtension) => this & TExtension;
}

export const useDirectus = <TSchema = any>(url: string, config?: ClientConfig) => {
	const client: DirectusClient<TSchema> = {
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
