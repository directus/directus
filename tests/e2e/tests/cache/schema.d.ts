export type Schema = {
	first: First[];
	ignored: Ignored[];
};
export type First = {
	id?: string | number;
	text?: string | number;
};
export type Ignored = {
	id?: string | number;
	text?: string | number;
};