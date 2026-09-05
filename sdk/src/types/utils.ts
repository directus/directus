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

/**
 * Suggests known literal values via autocomplete while still accepting any other string.
 * For fields whose value set isn't enforced by the API (e.g. an unconstrained DB column),
 * so values outside the known set aren't rejected.
 */
export type StringLiteralUnion<T extends string> = T | (string & {});

export type IsNullable<T, Y = true, N = never> = T | null extends T ? Y : N;
export type IsDateTime<T, Y, N> = T extends 'datetime' | 'date' | 'time' ? Y : N;
export type IsNumber<T, Y, N> = T extends number ? Y : N;
export type IsString<T, Y, N> = T extends string ? Y : N;

/**
 * Recursively make properties optional
 */
export type NestedPartial<Item> = Item extends any[]
	? UnpackList<Item> extends infer RawItem
		? NestedPartial<RawItem>[]
		: never
	: // `string & {}` (as used by StringLiteralUnion) satisfies `extends object` despite being a
		// primitive, so it must be excluded here or it gets mapped over String.prototype's own keys.
		Item extends string | number | boolean | bigint | symbol
		? Item
		: Item extends object
			? { [Key in keyof Item]?: NestedPartial<Item[Key]> }
			: Item;

/**
 * Reduces a complex object type to make it readable in IDEs.
 */
export type Prettify<T> = {
	[K in keyof T]: T[K];
} & unknown;
