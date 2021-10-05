/**
 * Revisions handler
 */

import { ItemsHandler } from '../base/items.js';
import { ITransport } from '../transport.js';
import { RevisionType, DefaultType } from '../types.js';

export type RevisionItem<T = DefaultType> = RevisionType & T;

export class RevisionsHandler<T = DefaultType> extends ItemsHandler<RevisionItem<T>> {
	constructor(transport: ITransport) {
		super('directus_revisions', transport);
	}
}
