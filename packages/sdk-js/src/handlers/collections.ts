/**
 * Collections handler
 */

import { ItemsHandler } from '../base/items';
import { ITransport } from '../transport';
import { CollectionType } from '../types';

export type CollectionItem<T extends object = {}> = CollectionType & T;

export class CollectionsHandler<T extends object> extends ItemsHandler<CollectionItem<T>> {
	constructor(transport: ITransport) {
		super('directus_collections', transport);
	}
}
