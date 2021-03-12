/**
 * Relations handler
 */

import { ItemsHandler } from '../base/items';
import { ITransport } from '../transport';
import { RelationType } from '../types';

export type RelationItem<T extends object = {}> = RelationType & T;

export class RelationsHandler<T extends object> extends ItemsHandler<RelationItem<T>> {
	constructor(transport: ITransport) {
		super('directus_relations', transport);
	}
}
