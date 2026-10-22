export interface Schema {
	plants: Plants[];
	sizes: Sizes[];
}

export interface Plants {
	id: number;
	name: string | null;
	size: number | Sizes | null;
}

export interface Sizes {
	id: number;
	size: string | null;
}
