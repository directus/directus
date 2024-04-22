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

export type GqlResult<Schema, Collection extends keyof Schema> = {
	[Key in Collection]: Schema[Collection][];
};
