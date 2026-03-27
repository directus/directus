export type Schema = {
	cache_delete: CacheDelete[];
	test: Test[];
};
export type CacheDelete = {
	id?: string | number;
};
export type Test = {
	id?: string | number;
	text?: string | number;
};
