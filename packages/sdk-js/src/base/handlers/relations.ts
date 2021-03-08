/**
 * Relations handler
 */

import { DefaultFields } from './default';
import { ItemsHandler } from '..';
import { ITransport } from '../../transport';

export type Relations<T extends object = DefaultFields> = {
	// Relations Fields
} & T;

export class RelationsHandler<T extends object> extends ItemsHandler<Relations<T>> {
	constructor(transport: ITransport) {
		super('directus_relations', transport);
	}
}
