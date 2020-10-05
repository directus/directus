export type Revision = {
	activity: number;
	collection: string;
	item: string | number;
	data: null | Record<string, any>;
	delta: null | Record<string, any>;
};
