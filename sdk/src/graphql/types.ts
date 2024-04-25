export interface GraphqlClient<_Schema> {
	query<Output extends object = Record<string, any>>(
		query: string,
		variables?: Record<string, unknown>,
		scope?: 'items' | 'system',
	): Promise<Output>;
}

export interface GraphqlConfig {
	credentials?: RequestCredentials;
}

// these utility types do not have schema fallback logic

export type GqlResult<Schema extends object, Collection extends keyof Schema> = {
	[Key in Collection]: Schema[Collection][];
};

export type GqlSingletonResult<Schema extends object, Collection extends keyof Schema> = {
	[Key in Collection]: Schema[Collection];
};
