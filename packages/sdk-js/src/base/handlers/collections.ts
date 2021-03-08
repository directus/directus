/**
 * Collections handler
 */

import { DefaultFields } from './default';
import { ItemsHandler } from '..';
import { ITransport } from '../../transport';

export type Collections<T extends object = DefaultFields> = {
	// Collections Fields
} & T;

export class CollectionsHandler<T extends object> extends ItemsHandler<Collections<T>> {
	constructor(transport: ITransport) {
		super('directus_collections', transport);
	}
}
