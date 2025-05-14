export type Item = Record<string, any>;

/** Contains the path of relation fields in case this is a nested execution.
 * @example ['tags', 'tag_id']
 */
export type NestedPath = string[];

/** Allows hooks and other extensions to persist data in a run. */
export type CustomContext = Record<string, any>;

export type PrimaryKey = string | number;

export type Alterations<T extends Item = Item, K extends keyof T | undefined = undefined> = {
	create: Partial<T>[];
	update: (K extends keyof T ? Partial<T> & Pick<T, K> : Partial<T>)[];
	delete: (K extends keyof T ? T[K] : PrimaryKey)[];
};
