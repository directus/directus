export type GqlResult<Schema extends object, Collection extends keyof Schema> = {
	[x in Collection]: Schema[Collection][];
};
