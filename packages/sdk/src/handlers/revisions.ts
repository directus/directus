/**
 * Revisions handler
 */

import { ItemsHandler } from '../base/items';
import { Transport } from '../transport';
import { RevisionType, DefaultType } from '../types';

export type RevisionItem<T = DefaultType> = RevisionType & T;

export class RevisionsHandler<T = DefaultType> extends ItemsHandler<RevisionItem<T>> {
	constructor(transport: Transport) {
		super('directus_revisions', transport);
	}
}
