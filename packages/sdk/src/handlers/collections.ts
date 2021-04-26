/**
 * Collections handler
 */

import { ItemsHandler } from '../base/items';
import { ITransport } from '../transport';
import { CollectionType, DefaultType } from '../types';

export type CollectionItem<T = DefaultType> = CollectionType & T;

export class CollectionsHandler<T = DefaultType> extends ItemsHandler<CollectionItem<T>> {
	constructor(transport: ITransport) {
		super('directus_collections', transport);
	}
}
