export interface ClientConfig {
	token?: string;
}

export interface DirectusClient<Schema extends object = any, Features extends object = Record<string, never>> {
	config: { url: URL };
	auth: { token: string | null };
	use: <ExtraFeatures extends object>(
		feature: (client: DirectusClient<Schema, Features>) => ExtraFeatures
	) => DirectusClient<Schema, Features & ExtraFeatures>;
}

export const useDirectus = <Schema extends object>(url: string, config?: ClientConfig) => {
	const client: DirectusClient<Schema> = {
		config: {
			url: new URL(url),
		},
		auth: {
			token: config?.token ?? null,
		},
		use(feature) {
			const extra = feature(this);

			return {
				...this,
				...extra,
			};
		},
	};

	return client;
};
