import { Item, OneItem, ItemInput, QueryOne } from './items';

/**
 * CRUD at its finest
 */
export interface ISingleton<T extends Item> {
	read<Q extends QueryOne<T>>(query?: Q): Promise<OneItem<T, Q>>;
	update<Q extends QueryOne<T>>(item: ItemInput<T>, query?: Q): Promise<OneItem<T, Q>>;
}
