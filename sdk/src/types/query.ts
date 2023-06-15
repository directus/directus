import type { PrimaryKey } from '@directus/types';
import type { Filter } from './filter.js';

export type Optional<T> = T | undefined;

export type Query<Item extends object> = {
	fields?: QueryFields<Item>;
	// sort?: string[] | null;
	// filter?: Filter<Item> | null;
	// limit?: number | null;
	// offset?: number | null;
	// page?: number | null;
	// search?: string | null;
	// deep?: NestedDeepQuery<Item> | null;
	// alias?: Record<keyof Item, string> | null;
};

//////////////////////////// DEMO
interface Article {
	id: number;
	title: string;
	author: Relation<Author>;
}

interface Author {
	id: number;
	name: string;
	friend: Relation<Author>;
	// friends: Relation<Author[]>; TODO multiple relation like o2m m2o
}

type TestFields = QueryFields<Article>;

const test: TestFields = [{ author: ['name', 'id', { friend: [{ friend: [] }] }] }];
////////////////////////////

export type Relation<R extends object> = R | PrimaryKey;

export type RelationFields<Item extends object> = {
	[key in keyof Item]: Item[key] extends Relation<object> ? (Item[key] extends PrimaryKey ? never : key) : never;
}[keyof Item];

export type FlatFields<Item extends object> = keyof Item & string;

export type ExtractRelation<Item extends object> = Exclude<Item, PrimaryKey>;

export type ExtractArray<T> = T extends (infer U)[] ? U : T;

export type NestedFields<Item extends object, Fields extends keyof Item> = {
	[Field in Fields]: (
		| '*'
		| FlatFields<ExtractRelation<Item[Field]>>
		| NestedFields<ExtractRelation<Item[Field]>, RelationFields<ExtractRelation<Item[Field]>>>
	)[];
};

export type QueryFields<Item extends object> = ('*' | FlatFields<Item> | NestedFields<Item, RelationFields<Item>>)[];

export type DeepQuery<Item extends object> = {
	_fields?: QueryFields<Item>;
	_sort?: string[] | null;
	_filter?: Filter<Item> | null;
	_limit?: number | null;
	_offset?: number | null;
	_page?: number | null;
	_search?: string | null;
};
export type NestedDeepQuery<Item extends object> = {
	[field in keyof Item]: DeepQuery<Item> | NestedDeepQuery<Item>;
};
