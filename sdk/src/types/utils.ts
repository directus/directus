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
export type IfNever<T, Y, N = T> = [T] extends [never] ? Y : N;

/**
 * Test for any
 */
export type IfAny<T, Y, N> = 0 extends 1 & T ? Y : N;
export type IsAny<T> = IfAny<T, true, never>;

export type IsNullable<T, Y = true, N = never> = T | null extends T ? Y : N;
export type IsDateTime<T, Y, N> = T extends 'datetime' ? Y : N;
export type IsNumber<T, Y, N> = T extends number ? Y : N;
export type IsString<T, Y, N> = T extends string ? Y : N;

export type NestedPartial<Item extends object> = {
	[Key in keyof Item]?: NonNullable<Item[Key]> extends infer NestedItem
		? NestedItem extends object[]
			? NestedPartial<UnpackList<NestedItem>>[] | Exclude<Item[Key], NestedItem>
			: NestedItem extends object
			  ? NestedPartial<NestedItem> | Exclude<Item[Key], NestedItem>
			  : Item[Key]
		: Item[Key];
};

/**
 * Reduces a complex object type to make it readable in IDEs.
 */
export type Prettify<T> = {
	[K in keyof T]: T[K];
} & unknown;
