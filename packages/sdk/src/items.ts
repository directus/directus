import { TransportRequestOptions } from './transport';
import { ID, OptionalKeys, RequiredKeys } from './types';

export type Field = string;

export type Item = Record<string, any>;

export type ItemInput<T> = {
	[P in keyof T]?: T[P] extends Record<string, any> ? ItemInput<T[P]> : T[P];
};
export type InferQueryType<T extends ManyItems<any> | QueryOne<any>> = 'data' extends keyof T ? T['data'] : T;

export type DefaultItem<T> = {
	[K in keyof T]: NonNullable<T[K]> extends (infer U)[]
		? Extract<NonNullable<U>, Record<string, unknown>> extends never
			? U[]
			: (string | number)[]
		: Extract<T[K], Record<string, unknown>> extends never
		? T[K]
		: Exclude<T[K], Record<string, unknown>> | string | number;
};

export type OneItem<
	T extends Item,
	Q extends QueryOne<T> = Record<'fields', undefined>,
	F extends string[] | false = QueryFields<Q>
> = (F extends false ? DefaultItem<T> : PickedDefaultItem<T, F>) | null | undefined;

export type ManyItems<T extends Item, Q extends QueryMany<T> = Record<string, any>> = {
	data?: NonNullable<OneItem<T, Q>>[] | null;
	meta?: ItemMetadata;
};

export type ItemMetadata = {
	total_count?: number;
	filter_count?: number;
};

export type Payload = Record<string, any>;

export enum Meta {
	TOTAL_COUNT = 'total_count',
	FILTER_COUNT = 'filter_count',
}

export type QueryFields<Q extends Record<string, any>> = Q extends Record<'fields', unknown>
	? Q['fields'] extends string
		? [Q['fields']]
		: Q['fields'] extends string[]
		? Q['fields']
		: false
	: false;

type DeepPathBranchHelper<T, K extends keyof T, V, R extends string> = K extends keyof V
	? TreeBranch<T[K], R, V[K]>
	: K extends keyof (V & { [_ in K]: unknown })
	? TreeBranch<T[K], R, (V & { [_ in K]: unknown })[K]>
	: never;

type WildCardHelper<T, K extends keyof T, V, R extends string> = string extends K
	? { [K: string]: T[K] }
	: NonNullable<T[K]> extends (infer U)[]
	? Extract<NonNullable<U>, Record<string, unknown>> extends never
		? TreeLeaf<U>
		: DeepPathBranchHelper<T, K, V, R>
	: Extract<NonNullable<T[K]>, Record<string, unknown>> extends never
	? TreeLeaf<T[K]>
	: DeepPathBranchHelper<T, K, V, R>;

type DeepPathToObject<
	Path extends string,
	T extends Record<string, any>,
	Val = Record<string, never>
> = string extends Path
	? never
	: Path extends `${infer Key}.${infer Rest}`
	? Key extends '*'
		? Rest extends `${infer NextVal}.${string}`
			? NextVal extends '*'
				? Val & {
						[K in keyof T]: WildCardHelper<T, K, Val, Rest>;
				  }
				: Val & {
						[K in keyof T]: NextVal extends keyof T[K] ? DeepPathBranchHelper<T, K, Val, Rest> : never;
				  }
			: Rest extends '*'
			? Val & {
					[K in keyof T]: WildCardHelper<T, K, Val, Rest>;
			  }
			: Val & {
					[K in keyof T]: Rest extends keyof T[K] ? DeepPathBranchHelper<T, K, Val, Rest> : never;
			  }
		: Key extends keyof T
		? Val & {
				[K in OptionalKeys<Pick<T, Key>>]?: DeepPathBranchHelper<T, K, Val, Rest>;
		  } & {
				[K in RequiredKeys<Pick<T, Key>>]: DeepPathBranchHelper<T, K, Val, Rest>;
		  }
		: never
	: string extends keyof T
	? Val & Record<string, unknown>
	: Path extends keyof T
	? Val & {
			[K in OptionalKeys<Pick<T, Path>>]?: TreeLeaf<T[K]>;
	  } & {
			[K in RequiredKeys<Pick<T, Path>>]: TreeLeaf<T[K]>;
	  }
	: Path extends '*'
	? Val & {
			[K in OptionalKeys<T>]?: TreeLeaf<T[K]>;
	  } & {
			[K in RequiredKeys<T>]: TreeLeaf<T[K]>;
	  }
	: never;

type TreeBranch<
	T,
	Path extends string,
	Val = Record<string, never>,
	NT extends Record<string, any> = NonNullable<T>
> = NT extends (infer U)[]
	? (ArrayTreeBranch<Extract<U, Record<string, unknown>>, Path, Val> | Exclude<U, Record<string, unknown>>)[]
	: IsUnion<T> extends true
	? DeepPathToObject<Path, Extract<T, Record<string, unknown>>, Val> | Exclude<T, Record<string, unknown>>
	: DeepPathToObject<Path, NT, Val>;

type ArrayTreeBranch<
	U,
	Path extends string,
	Val = Record<string, never>,
	NU extends Record<string, any> = NonNullable<U>
> = Extract<NU, Record<string, unknown>> extends infer OB extends Record<string, any>
	? Val extends (infer _)[]
		? DeepPathToObject<Path, OB, Val[number]>
		: DeepPathToObject<Path, OB, Val>
	: Val extends (infer _)[]
	? DeepPathToObject<Path, NU, Val[number]>
	: DeepPathToObject<Path, NU, Val>;

type TreeLeaf<T, NT = NonNullable<T>> = NT extends (infer U)[]
	? Exclude<U, Record<string, unknown>>[]
	: Exclude<T, Record<string, unknown>>;

type UnionToIntersectionFn<TUnion> = (TUnion extends TUnion ? (union: () => TUnion) => void : never) extends (
	intersection: infer Intersection
) => void
	? Intersection
	: never;

type LastUnion<TUnion> = UnionToIntersectionFn<TUnion> extends () => infer Last ? Last : never;

type UnionToTuple<TUnion, TResult extends Array<unknown> = []> = TUnion[] extends never[]
	? TResult
	: UnionToTuple<Exclude<TUnion, LastUnion<TUnion>>, [...TResult, LastUnion<TUnion>]>;

export type PickedDefaultItem<T extends Item, Fields, Val = Record<string, unknown>> = unknown extends T
	? any
	: Fields extends string[]
	? Fields['length'] extends 0
		? T
		: UnionToTuple<Fields[number]> extends [infer First, ...infer Rest]
		? First extends string
			? IntersectionToObject<
					Rest['length'] extends 0
						? DeepPathToObject<First, T, Val>
						: PickedDefaultItem<T, Rest, DeepPathToObject<First, T, Val>>
			  >
			: never
		: never
	: never;

type IntersectionToObject<U> = U extends (infer U2)[]
	? Array<IntersectionToObject<U2>>
	: U extends infer O
	? O extends string
		? string
		: O extends number
		? number
		: O extends symbol
		? symbol
		: O extends boolean
		? boolean
		: {
				[K in keyof O as unknown extends O[K] ? never : K]: O[K] extends (infer U)[]
					? Array<IntersectionToObject<U>>
					: IsUnion<O[K]> extends true
					? IntersectionToObject<O[K]>
					: O[K] extends Record<string, any>
					? IntersectionToObject<O[K]>
					: O[K];
		  }
	: never;

export type QueryOne<T = unknown> = {
	fields?: unknown extends T ? string | string[] : DotSeparated<T, 5> | DotSeparated<T, 5>[];
	search?: string;
	deep?: Deep<T>;
	export?: 'json' | 'csv' | 'xml';
	filter?: Filter<T>;
};

export type QueryMany<T> = QueryOne<T> & {
	sort?: Sort<T>;
	limit?: number;
	offset?: number;
	page?: number;
	meta?: keyof ItemMetadata | '*';
	groupBy?: string | string[];
	aggregate?: Aggregate;
	alias?: Record<string, string>;
};

export type Deep<T> = {
	[K in keyof SingleItem<T>]?: DeepQueryMany<SingleItem<T>[K]>;
};

export type DeepQueryMany<T> = {
	[K in keyof QueryMany<SingleItem<T>> as `_${string & K}`]: QueryMany<SingleItem<T>>[K];
} & {
	[K in keyof NestedObjectKeys<SingleItem<T>>]?: DeepQueryMany<NestedObjectKeys<SingleItem<T>>[K]>;
};

export type NestedObjectKeys<T> = {
	[P in keyof T]: NonNullable<T[P]> extends (infer U)[]
		? Extract<U, Record<string, unknown>> extends Record<string, unknown>
			? Extract<U, Record<string, unknown>>
			: never
		: Extract<NonNullable<T[P]>, Record<string, unknown>> extends Record<string, unknown>
		? Extract<NonNullable<T[P]>, Record<string, unknown>>
		: never;
};

export type SharedAggregate = {
	avg?: string[];
	avgDistinct?: string[];
	count?: string[];
	countDistinct?: string[];
	sum?: string[];
	sumDistinct?: string[];
	min?: string[];
	max?: string[];
};

export type Aggregate = {
	[K in keyof SharedAggregate]: string;
};

export type Sort<T> = (`${Extract<keyof SingleItem<T>, string>}` | `-${Extract<keyof SingleItem<T>, string>}`)[];

export type FilterOperators<T> = {
	_eq?: T;
	_neq?: T;
	_gt?: T;
	_gte?: T;
	_lt?: T;
	_lte?: T;
	_in?: T[];
	_nin?: T[];
	_between?: [T, T];
	_nbetween?: [T, T];
	_contains?: T;
	_ncontains?: T;
	_starts_with?: T;
	_nstarts_with?: T;
	_ends_with?: T;
	_nends_with?: T;
	_empty?: boolean;
	_nempty?: boolean;
	_nnull?: boolean;
	_null?: boolean;
	_intersects?: T;
	_nintersects?: T;
	_intersects_bbox?: T;
	_nintersects_bbox?: T;
};

export type LogicalFilterAnd<T> = { _and: Filter<T>[] };
export type LogicalFilterOr<T> = { _or: Filter<T>[] };
export type LogicalFilter<T> = LogicalFilterAnd<T> | LogicalFilterOr<T>;

export type FieldFilter<T> = {
	[K in keyof SingleItem<T>]?: FilterOperators<SingleItem<T>[K]> | FieldFilter<SingleItem<T>[K]>;
};

export type Filter<T> = LogicalFilter<T> | FieldFilter<T>;

export type ItemsOptions = {
	requestOptions: TransportRequestOptions;
};

type SingleItem<T> = Exclude<Single<T>, ID>;
type Single<T, NT = NonNullable<T>> = NT extends Array<unknown> ? NT[number] : NT;

/**
 * CRUD at its finest
 */
export interface IItems<T extends Item> {
	createOne<Q extends QueryOne<T>>(item: ItemInput<T>, query?: Q, options?: ItemsOptions): Promise<OneItem<T, Q>>;
	createMany<Q extends QueryOne<T>>(items: ItemInput<T>[], query?: Q, options?: ItemsOptions): Promise<ManyItems<T, Q>>;

	readOne<Q extends QueryOne<T>>(id: ID, query?: Q, options?: ItemsOptions): Promise<OneItem<T, Q>>;
	readMany<Q extends QueryMany<T>>(ids: ID[], query?: Q, options?: ItemsOptions): Promise<ManyItems<T, Q>>;
	readByQuery<Q extends QueryMany<T>>(query?: Q, options?: ItemsOptions): Promise<ManyItems<T, Q>>;

	updateOne<Q extends QueryOne<T>>(
		id: ID,
		item: ItemInput<T>,
		query?: Q,
		options?: ItemsOptions
	): Promise<OneItem<T, Q>>;
	updateMany<Q extends QueryMany<T>>(
		ids: ID[],
		item: ItemInput<T>,
		query?: Q,
		options?: ItemsOptions
	): Promise<ManyItems<T, Q>>;
	updateBatch<Q extends QueryMany<T>>(
		items: ItemInput<T>[],
		query?: Q,
		options?: ItemsOptions
	): Promise<ManyItems<T, Q>>;

	deleteOne(id: ID, options?: ItemsOptions): Promise<void>;
	deleteMany(ids: ID[], options?: ItemsOptions): Promise<void>;
}

export class EmptyParamError extends Error {
	constructor(paramName?: string) {
		super(`${paramName ?? 'ID'} cannot be an empty string`);
	}
}

type IsUnion<T, U extends T = T> = T extends unknown ? ([U] extends [T] ? false : true) : false;
type AppendToPath<Path extends string, Appendix extends string> = Path extends '' ? Appendix : `${Path}.${Appendix}`;
type OneLevelUp<Path extends string> = Path extends `${infer Start}.${infer Middle}.${infer Rest}`
	? Rest extends `${string}.${string}.${string}`
		? `${Start}.${Middle}.${OneLevelUp<Rest>}`
		: Rest extends `${infer NewMiddle}.${string}`
		? `${Start}.${Middle}.${NewMiddle}`
		: Rest extends string
		? `${Start}.${Middle}`
		: ''
	: Path extends `${infer Start}.${string}`
	? Start
	: '';

type LevelsToAsterisks<Path extends string> = Path extends `${string}.${string}.${infer Rest}`
	? Rest extends `${string}.${string}.${string}`
		? `*.*.${LevelsToAsterisks<Rest>}`
		: Rest extends `${string}.${string}`
		? `*.*.*.*`
		: Rest extends string
		? `*.*.*`
		: ''
	: Path extends `${string}.${string}`
	? '*.*'
	: Path extends ''
	? ''
	: '*';

type DefaultAppends<
	Path extends string,
	Appendix extends string,
	Nested extends boolean = true,
	Prepend extends boolean = true
> =
	| AppendToPath<Path, Appendix>
	| AppendToPath<LevelsToAsterisks<Path>, Appendix>
	| (Prepend extends true
			?
					| AppendToPath<Path, '*'>
					| AppendToPath<LevelsToAsterisks<Path>, Appendix>
					| (OneLevelUp<Path> extends '' ? never : AppendToPath<AppendToPath<OneLevelUp<Path>, '*'>, Appendix>)
			: never)
	| (Nested extends true
			?
					| AppendToPath<AppendToPath<LevelsToAsterisks<Path>, Appendix>, '*'>
					| AppendToPath<AppendToPath<LevelsToAsterisks<Path>, '*'>, '*'>
					| AppendToPath<AppendToPath<Path, Appendix>, '*'>
					| AppendToPath<AppendToPath<Path, '*'>, '*'>
					| (OneLevelUp<Path> extends ''
							? never
							: AppendToPath<AppendToPath<AppendToPath<OneLevelUp<Path>, '*'>, Appendix>, '*'>)
			: never);

type DotSeparated<
	T,
	N extends number,
	Level extends number[] = [],
	Path extends string = ''
> = Level['length'] extends N
	? Path
	: T extends (infer U)[]
	? Extract<U, Record<string, unknown>> extends Record<string, unknown>
		? DotSeparated<Extract<U, Record<string, unknown>>, N, Level, Path>
		: Path
	: Extract<NonNullable<T>, Record<string, unknown>> extends Record<string, unknown>
	? {
			[K in keyof T]: K extends string
				? NonNullable<T[K]> extends (infer U)[]
					? Extract<U, Record<string, unknown>> extends never
						? DefaultAppends<Path, K, false>
						:
								| DotSeparated<Extract<U, Record<string, unknown>>, N, [...Level, 0], AppendToPath<Path, K>>
								| DefaultAppends<Path, K>
					: Extract<T[K], Record<string, unknown>> extends never
					? DefaultAppends<Path, K, false>
					:
							| DotSeparated<Extract<T[K], Record<string, unknown>>, N, [...Level, 0], AppendToPath<Path, K>>
							| DefaultAppends<Path, K>
				: never;
	  }[keyof T]
	: never;
