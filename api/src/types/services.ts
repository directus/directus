import type {
	Accountability,
	CustomContext,
	Item,
	NestedPath,
	PrimaryKey,
	Query,
	SchemaOverview,
} from '@directus/types';
import type { Knex } from 'knex';

export type AbstractServiceOptions = {
	knex?: Knex | undefined;
	accountability?: Accountability | null | undefined;
	schema: SchemaOverview;
} & Partial<RequestContext>;

/** Context to group information related to a request in services */
export type RequestContext = {
	nested: NestedPath,
	customContext: CustomContext
}

export interface AbstractService {
	knex: Knex;
	accountability: Accountability | null | undefined;
	requestContext: RequestContext;

	createOne(data: Partial<Item>): Promise<PrimaryKey>;
	createMany(data: Partial<Item>[]): Promise<PrimaryKey[]>;

	readOne(key: PrimaryKey, query?: Query): Promise<Item>;
	readMany(keys: PrimaryKey[], query?: Query): Promise<Item[]>;
	readByQuery(query: Query): Promise<Item[]>;

	updateOne(key: PrimaryKey, data: Partial<Item>): Promise<PrimaryKey>;
	updateMany(keys: PrimaryKey[], data: Partial<Item>): Promise<PrimaryKey[]>;

	deleteOne(key: PrimaryKey): Promise<PrimaryKey>;
	deleteMany(keys: PrimaryKey[]): Promise<PrimaryKey[]>;
}
