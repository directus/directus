/**
 * Relations handler
 */

import { ItemsHandler } from '../base/items';
import { ITransport } from '../transport';
import { RelationType, DefaultType } from '../types';

export type RelationItem<T = DefaultType> = RelationType & T;

export class RelationsHandler<T = DefaultType> extends ItemsHandler<RelationItem<T>> {
	constructor(transport: ITransport) {
		super('directus_relations', transport);
	}
}
