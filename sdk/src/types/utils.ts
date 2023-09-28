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
export type NeverToUnknown<T> = IfNever<T, unknown>;
export type IfNever<T, Y> = [T] extends [never] ? Y : T;

/**
 * Test for any
 */
export type IfAny<T, Y, N> = 0 extends 1 & T ? Y : N;
export type IsAny<T> = IfAny<T, true, never>;

export type IsNullable<T, Y = true, N = never> = T | null extends T ? Y : N;

export type NestedPartial<Item extends object> = {
	[Key in keyof Item]?: Item[Key] extends object ? NestedPartial<Item[Key]> : Item[Key];
};

/**
 * Resolve type to its final object
 */
export type Identity<U> = U extends infer A ? A : U;
