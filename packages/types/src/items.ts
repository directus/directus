export type Item = Record<string, any>;

export type PrimaryKey = string | number;

export type Alterations<T extends Item = Item, K extends keyof T | undefined = undefined> = {
	create: Partial<T>[];
	update: (K extends keyof T ? Partial<T> & Pick<T, K> : Partial<T>)[];
	delete: (K extends keyof T ? T[K] : PrimaryKey)[];
};
