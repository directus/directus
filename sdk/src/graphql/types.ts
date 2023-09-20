export interface GraphqlClient<_Schema extends object> {
	query<Output extends object = Record<string, any>>(
		query: string,
		variables?: Record<string, unknown>,
		scope?: 'items' | 'system'
	): Promise<Output>;
}

export interface GraphqlConfig {
	credentials?: RequestCredentials;
}

export type GqlResult<Schema extends object, Collection extends keyof Schema> = {
	[Key in Collection]: Schema[Collection][];
};
