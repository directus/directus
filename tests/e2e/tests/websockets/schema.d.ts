export type Schema = {
	plants: Plants[];
	sizes: Sizes[];
};
export type Plants = {
	id?: string | number;
	name?: string | number;
	size?: string | number | Sizes;
};
export type Sizes = {
	id?: string | number;
	size?: string | number;
};
