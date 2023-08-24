import { createDirectus } from './client.js';
import { authentication, rest, readWebhooks, readItem, readItems, type IsNullable, type ApplyQueryFields, type ArrayFunctions } from './index.js';

import { aggregate } from "./index.js"

const client = createDirectus<MySchema>('http://localhost:8056/')
	.with(authentication('json', { autoRefresh: false }))
	.with(rest());

client.login('test', 'test')

// await client.login('admin@example.com', 'd1r3ctu5');

const data = await client.request(readItems('test', {
    fields: ['*'],
}))
// const data = await client.request(readItems('collection_a', {
//     fields: ['id', 'count(m2a)', { 'm2o': ['*'], 'm2m': [{'collection_b_id':['id']}]}],
// }))
// client.request(aggregate('collection_a', { 'query': {'filter' :}}))
//

const x = data[0]?.id

type z = "json" | null | undefined
type x = Extract<z, string>
type y = "json" extends z ? 'y':'n'

type AA = ArrayFunctions<MySchema, CollectionA>;

// The main schema type containing all collections available
export interface MySchema {
	test: Test[];
	collection_a: CollectionA[]; // regular collections are array types
	collection_b: CollectionB[];
	collection_c: CollectionC; // this is a singleton
	// junction collections are collections too
	collection_a_b_m2m: CollectionAB_Many[];
	collection_a_b_m2a: CollectionAB_Any[];
	directus_users: CustomDirectusUser[];
}

// collection A
export interface CollectionA {
	id: number;
	status: string | null;
	// relations
	m2o: number | CollectionB;
	o2m: number[] | CollectionB[] | null;
	m2m: number[] | CollectionAB_Many[] | null;
	m2a: number[] | CollectionAB_Any[];
}

// Many-to-Many junction table
export interface CollectionAB_Many {
	id: number;
	collection_a_id: number | CollectionA;
	collection_b_id: number | CollectionB;
}

// Many-to-Any junction table
export interface CollectionAB_Any {
	id: number;
	collection_a_id: number | CollectionA;
	collection: 'collection_b' | 'collection_c';
	item: string | CollectionB | CollectionC;
}

// collection B
export interface CollectionB {
	id: number;
	value: 'datetime';
	test2: CollectionA[];
}

// singleton collection
export interface CollectionC {
	id: number;
	app_settings: string;
	something: string;
}

export interface Test {
	id: number;
	test: number | null;
	xx: 'json' | null;
	mk: string | null;
	date: 'datetime' | null;
	testdate: 'datetime' | null;
	recur: number | null;
	csv: string[] | null;
	bignr: string | null; // perhaps we want the bigint type later
}

export interface CustomDirectusUser {
	cool_custom_field: string;
}

type fields = Readonly<['id', { 'm2o': ['*'] }, { 'm2m': ['*']}][number]>;

type test = ApplyQueryFields<MySchema, CollectionA, fields>
