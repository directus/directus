type Primitive = undefined | null | string | number | boolean | bigint | symbol;
type Builtin = Primitive | Date | Error | RegExp | ((...args: any[]) => unknown);

export type DeepPartial<T> = T extends Builtin
	? T
	: T extends []
	? []
	: T extends [infer U, ...infer R]
	? [DeepPartial<U>, ...DeepPartial<R>]
	: T extends Array<infer U>
	? Array<DeepPartial<U>>
	: T extends ReadonlyArray<infer U>
	? ReadonlyArray<DeepPartial<U>>
	: T extends Map<infer K, infer V>
	? Map<DeepPartial<K>, DeepPartial<V>>
	: T extends ReadonlyMap<infer K, infer V>
	? ReadonlyMap<DeepPartial<K>, DeepPartial<V>>
	: T extends WeakMap<infer K, infer V>
	? WeakMap<DeepPartial<K>, DeepPartial<V>>
	: T extends Set<infer U>
	? Set<DeepPartial<U>>
	: T extends ReadonlySet<infer U>
	? ReadonlySet<DeepPartial<U>>
	: T extends WeakSet<infer U>
	? WeakSet<DeepPartial<U>>
	: T extends Promise<infer U>
	? Promise<DeepPartial<U>>
	: T extends Record<any, any>
	? { [K in keyof T]?: DeepPartial<T[K]> }
	: Partial<T>;

export type JsonValue = null | string | number | boolean | JsonValue[] | { [key: string]: JsonValue };

export type GenericString<T> = T extends string ? string : T;

export type Plural<T extends string> = `${T}s`;

export type UnknownObject = Record<string | number | symbol, unknown>;
