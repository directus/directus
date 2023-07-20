/**
 * Makes types mutable
 */
export type Mutable<T> = T extends object ? { -readonly [K in keyof T]: Mutable<T[K]> } : T;

/**
 * Flatten array types to their singular root
 */
export type UnpackList<Item> = Item extends any[] ? Item[number] : Item;

/**
 * Merge two object types with never guard
 */
export type Merge<A, B, TypeA = NeverToUnknown<A>, TypeB = NeverToUnknown<B>> = {
	[K in keyof TypeA | keyof TypeB]: K extends keyof TypeA & keyof TypeB
		? TypeA[K] | TypeB[K]
		: K extends keyof TypeB
		? TypeB[K]
		: K extends keyof TypeA
		? TypeA[K]
		: never;
};

/**
 * Fallback never to unknown
 */
export type NeverToUnknown<T> = [T] extends [never] ? unknown : T;
