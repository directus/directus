import type { Relational } from './schema.js';
import type { KeysOfType } from './utils.js';

export interface Query<TItem extends object = any> {
	fields?: QueryFields<TItem>;
}

export type QueryFields<TItem extends object> = ('*' | RelationalFields<TItem>)[];

export type RelationalFields<TItem extends object> = KeysOfType<TItem, Relational<any>>;
