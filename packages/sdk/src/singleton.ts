import { Item, OneItem, PartialItem, QueryOne } from './items.js';

/**
 * CRUD at its finest
 */
export interface ISingleton<T extends Item> {
	read(query?: QueryOne<T>): Promise<OneItem<T>>;
	update(item: PartialItem<T>, query?: QueryOne<T>): Promise<OneItem<T>>;
}
