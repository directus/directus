/**
 * Revisions handler
 */

import { ItemsHandler } from '../items';
import { Transport } from '../transport';
import { DefaultType, RevisionType } from '../types';

export type RevisionItem<T = DefaultType> = RevisionType & T;

export class RevisionsHandler<T = DefaultType> extends ItemsHandler<RevisionItem<T>> {
	constructor(transport: Transport) {
		super('directus_revisions', transport);
	}
}
